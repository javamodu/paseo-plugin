from pathlib import Path
import sqlite3, tempfile, json

root=Path(__file__).resolve().parents[1]
checks=[]
def passed(name): checks.append({'name':name,'verdict':'PASS'})
def rejected(db,sql,params,name):
    try: db.execute(sql,params)
    except sqlite3.IntegrityError: passed(name)
    else: raise AssertionError(name)
with tempfile.TemporaryDirectory() as tmp:
    path=Path(tmp)/'test.sqlite'
    db=sqlite3.connect(path,isolation_level=None)
    db.executescript((root/'database/001-initial.sql').read_text())
    passed('Migration applies with foreign keys and WAL')
    db.execute("INSERT INTO capsules VALUES('c','goal','repo','commit')")
    db.execute("INSERT INTO plans VALUES('p','c',1,'plan','eval','policy','{}')")
    rejected(db,"UPDATE plans SET payload_json='bad' WHERE id='p'",(), 'Immutable plan')
    db.execute("INSERT INTO runs(id,plan_id,state,profile_hash,max_workers,max_attempts,max_reserved_tokens,deadline_at) VALUES('r','p','READY','profile',2,3,100,'tomorrow')")
    db.execute("INSERT INTO nodes VALUES('r','n','coder','[]','READY')")
    for i in range(1,4):
        db.execute("INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token) VALUES(?, 'r','n',?,'INTENT','input',1)",(f'a{i}',i))
    rejected(db,"INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token) VALUES('duplicate','r','n',1,'INTENT','input',1)",(), 'Attempt uniqueness')
    rejected(db,"INSERT INTO reservations VALUES('z1','a1',30,'ACTIVE')",(), 'Default stop latch blocks reservations')
    db.execute("UPDATE settings SET dispatch_paused=0")
    db.execute("INSERT INTO reservations VALUES('z1','a1',60,'ACTIVE')")
    rejected(db,"INSERT INTO reservations VALUES('z2','a2',50,'ACTIVE')",(), 'Token budget reservation enforced')
    db.execute("INSERT INTO reservations VALUES('z2','a2',30,'ACTIVE')")
    rejected(db,"INSERT INTO reservations VALUES('z3','a3',5,'ACTIVE')",(), 'Global capacity enforced')
    db.execute("UPDATE reservations SET state='RELEASED' WHERE id='z1'")
    rejected(db,"UPDATE reservations SET state='ACTIVE' WHERE id='z1'",(), 'Released reservation cannot reactivate')
    db.execute("UPDATE runs SET usage_unknown=1 WHERE id='r'")
    rejected(db,"INSERT INTO reservations VALUES('z3','a3',5,'ACTIVE')",(), 'Unknown usage blocks new reservation')
    db.execute("UPDATE runs SET usage_unknown=0 WHERE id='r'")
    db.execute("INSERT INTO commands VALUES('cmd','r',1,'START_RUN','operator','hash','{}','QUEUED',NULL)")
    rejected(db,"UPDATE commands SET payload_hash='different' WHERE id='cmd'",(), 'Same command cannot change payload')
    db.execute("INSERT INTO events(id,run_id,type,actor_id,causation_id,created_at,payload_json) VALUES('e','r','RUN_CREATED','operator','cmd','now','{}')")
    rejected(db,"DELETE FROM events WHERE id='e'",(), 'Event append-only')
    db.execute("INSERT INTO outbox VALUES('o','a3','cmd','key','START','{}','PENDING',NULL,NULL,1,NULL,0)")
    rejected(db,"INSERT INTO outbox VALUES('o2','a3','cmd','key','START','{}','PENDING',NULL,NULL,1,NULL,0)",(), 'Dispatch key unique')
    db.execute("BEGIN IMMEDIATE")
    db.execute("INSERT INTO commands VALUES('rollback','r',1,'START_RUN','operator','h','{}','QUEUED',NULL)")
    db.execute("ROLLBACK")
    assert db.execute("SELECT COUNT(*) FROM commands WHERE id='rollback'").fetchone()[0]==0
    passed('Rollback removes intent')
    other=sqlite3.connect(path,isolation_level=None,timeout=0.05)
    db.execute("BEGIN IMMEDIATE")
    try: other.execute("BEGIN IMMEDIATE")
    except sqlite3.OperationalError: passed('Second writer cannot claim concurrent transaction')
    else: raise AssertionError('Writer contention not blocked')
    db.execute("ROLLBACK");other.close()
    h='a'*64
    db.execute("INSERT INTO artifacts VALUES(?, 'blob',0,'text/plain','internal')",(h,))
    rejected(db,"INSERT INTO evidence VALUES('bad','a1',?,'candidate','eval','env',0,'PASS',0)",(h,), 'Zero-test PASS rejected by DB')
    db.execute("UPDATE settings SET dispatch_paused=1")
    db.close()
    db=sqlite3.connect(path)
    assert db.execute("SELECT dispatch_paused FROM settings WHERE id=1").fetchone()[0]==1
    passed('Stop latch survives DB reopen')
    assert db.execute("PRAGMA integrity_check").fetchone()[0]=='ok'
    passed('Fixture DB integrity')
    db.close()
print(json.dumps({'suite':'sqlite-reference-invariants','checks':checks},indent=2))
