"""Prepare a source-linked milestone sequence, without inventing historical years."""
from collections import defaultdict
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'data/processed/huaian-evolution.json').read_text(encoding='utf-8'))
drafts={q['assertion_id'] for q in data['quantitative_observations'] if not q.get('comparable_series_verified')}
rows=[a for a in data['assertions'] if a['time']['type']!='unknown' and not re.search('待核|待补|待查',a['time']['text']) and a['id'] not in drafts and a['function_codes']]
groups=defaultdict(list)
for a in rows:
 if a['time']['type']=='point':groups[a['time']['year']].append(a['id'])
titles={1415:'开河设闸，水路通起来',1592:'慈云庵的早期记述',1678:'河务管理进入清江浦',1728:'石码头街与交通服务',1750:'河务管理者营建书院',1839:'诗文留下牵船劳动',1853:'中洲出现慈善机构',1904:'寺中赈济',1906:'学堂进入寺院',1929:'官衙园林转为公共公园',1958:'桥梁与公共园林的新建设',1960:'水门桥建设',1963:'码头运输重心变化',1986:'慈云寺修复开放获批',1987:'萧湖公园开发',1988:'萧湖公园建成',1989:'楚秀园开放',1990:'慈云寺全面修复启动',1997:'文楼汤包的地方饮食记忆',2002:'漕运遗址进入考古视野',2003:'旧货运地段新建清江浦楼',2004:'中洲公园建成',2007:'中洲博物馆群建成',2008:'桥梁、公园与展示场所',2009:'饮食技艺进入非遗记忆',2010:'龙光阁重建',2011:'花街引入老字号与手工艺',2013:'水门桥工程记述',2014:'街区饮食休闲的再改造',2015:'清江浦记忆馆建设',2016:'萧湖公园改造升级'}
titles.update({1735:'慈云禅寺原址新建',1860:'寺院在战乱中毁损',1862:'慈云寺开始复建',1918:'大雄宝殿再次火毁',1936:'佛教协会支会进驻寺院',1946:'公园的纪念命名',1948:'恢复城南公园名称',1979:'周恩来故居修复开放',1985:'水门桥扩建与加固'})
frames=[{'id':'year-'+str(year),'year':year,'label':str(year)+'年','precision':'year','sort_key':year,'title':titles.get(year,'河岸留下新的记述'),'assertion_ids':ids} for year,ids in groups.items()]
# These keys order reading cards only. They never become claimed foundation years.
contexts=[('wanli','明万历年间',1580,['T003'],'中洲形成，河岸有了新的空间'),('qing-context','明清／清代',1736,['T004','T061','T050','T051','T046','T032'],'候闸、集散与岸边经营'),('late-context','晚清民国时期',1880,['T005','T035'],'公共信仰与街巷生活'),('1980s','20世纪80年代',1980,['T010','T031'],'运输、修复与公共游憩并存')]
valid={a['id'] for a in rows}
for key,label,order,ids,title in contexts:
 ids=[i for i in ids if i in valid]
 if ids:frames.append({'id':'context-'+key,'year':None,'label':label,'precision':'period','sort_key':order,'title':title,'assertion_ids':ids})
frames.sort(key=lambda f:f['sort_key'])
for f in frames:f.pop('sort_key')
published={i for f in frames for i in f['assertion_ids']}
result={'title':'从一闸，看一城的生长','frames':frames,'root_site_id':'SITE-QJ','riverbank_site_ids':['SITE-QJ','SITE-MZ','SITE-CY','SITE-QY','SITE-YM','SITE-HJ','SITE-SM','SITE-CX'],'relation_ids':[r['id'] for r in data['relations'] if all(i in published for i in r['assertion_ids'])],'time_note':'按史料节点推进；时期记述单独标注，节点间距不代表年数。','geometry_note':'点为地点参考，彩线为资料记述的联系，虚线为时间阅读顺序；不表示实测传播范围或历史航路。'}
target=ROOT/'frontend/assets/data/canal-spread.json';target.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'evidence/canal-spread-build.json').write_text(json.dumps({'frames':len(frames),'assertions':len(published),'source_assertion_ids':sorted(published),'no_invented_event_years':True,'no_diffusion_radius_measurement':True},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'frames':len(frames),'assertions':len(published)}))
