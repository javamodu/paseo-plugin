from pathlib import Path
import json, hashlib, subprocess, sys, re
root=Path(__file__).resolve().parents[1]
checks=[]
def passed(name): checks.append({'name':name,'verdict':'PASS'})
manifest=json.loads((root/'MANIFEST.json').read_text())
for item in manifest['files']:
    p=root/item['path']
    assert p.is_file(), item['path']
    assert hashlib.sha256(p.read_bytes()).hexdigest()==item['sha256'],item['path']
passed('All manifest content hashes match')
schema=json.loads((root/'contracts/schema.json').read_text())
examples=json.loads((root/'contracts/examples.json').read_text())

# Purpose-built subset checker for this package, not a general draft-07 implementation.
def check(value,s,path):
    if '$ref' in s:
        return check(value,schema['definitions'][s['$ref'].split('/')[-1]],path)
    if 'anyOf' in s:
        for branch in s['anyOf']:
            try: check(value,branch,path); return
            except AssertionError: pass
        raise AssertionError(path+': anyOf')
    if 'const' in s: assert value==s['const'],path+': const'
    if 'enum' in s: assert value in s['enum'],path+': enum'
    t=s.get('type')
    valid={'object':isinstance(value,dict),'array':isinstance(value,list),
           'string':isinstance(value,str),'boolean':isinstance(value,bool),
           'integer':isinstance(value,int) and not isinstance(value,bool),'null':value is None}
    if t: assert valid[t],path+': type'
    if t=='object':
        assert all(k in value for k in s.get('required',[])),path+': required'
        if s.get('additionalProperties') is False:
            assert not (set(value)-set(s.get('properties',{}))),path+': extra keys'
        for k,v in value.items():
            if k in s.get('properties',{}): check(v,s['properties'][k],path+'.'+k)
    if t=='array':
        assert len(value)>=s.get('minItems',0),path+': array length'
        for i,v in enumerate(value):check(v,s['items'],path+f'[{i}]')
    if t=='integer': assert value>=s.get('minimum',value),path+': minimum'
    if t=='string':
        assert len(value)>=s.get('minLength',0) and len(value)<=s.get('maxLength',len(value)),path+': length'
        if 'pattern' in s: assert re.search(s['pattern'],value),path+': pattern'
        if s.get('format')=='date-time':
            from datetime import datetime
            assert datetime.fromisoformat(value.replace('Z','+00:00')).tzinfo is not None,path+': datetime'
for name,value in examples.items():check(value,schema['definitions'][name],name)
passed('Contract positive fixtures validate in declared subset')
for name,value in [('Run',{**examples['Run'],'state':'MAGIC_SUCCESS'}),
                   ('Attempt',{**examples['Attempt'],'number':0}),
                   ('Approval',{**examples['Approval'],'rogue':True}),
                   ('Capsule',{k:v for k,v in examples['Capsule'].items() if k!='goal'})]:
    try:check(value,schema['definitions'][name],name)
    except AssertionError:passed('Invalid '+name+' fixture rejected')
    else:raise AssertionError('negative fixture unexpectedly valid')
for name,command in [
 ('domain',['node',str(root/'tests/domain.test.mjs')]),
 ('sqlite',[sys.executable,str(root/'tests/database.test.py')])
]:
    result=subprocess.run(command,capture_output=True,text=True,check=True,timeout=30)
    report=json.loads(result.stdout);checks.extend(report['checks'])
report={'scope':'offline package/schema subset/pure domain/fixture SQLite only',
        'checks':checks,'passed':len(checks),
        'liveRuntime':'NOT_RUN','productionSecurity':'NOT_RUN','liveBenchmark':'NOT_RUN'}
(root/'evidence/OFFLINE-CHECK.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'passed':len(checks),'scope':report['scope'],'production':'NOT_RUN'},ensure_ascii=False))
