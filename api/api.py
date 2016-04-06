#!/usr/bin/python
from flask import Flask, Response
import ujson as json
import logging
import sqlalchemy

app=Flask('w209dbapi')
engine = sqlalchemy.create_engine('mysql://reader@localhost/final', echo=True)
logger = logging.getLogger('w209dbapi')

def generate(cursor):
    err=''
    keys=cursor.keys()
    yield '{"keys":'+json.dumps(keys)+',"rows":['
    try:
        first=True
        for row in cursor:
            if first:
                pfx=''
                first=False
            else:
                pfx=','
            yield  pfx+json.dumps(row.values())
    except Exception,e:
        err=',"error":' + json.dumps(str(e))
    finally:
        yield ']'+err+'}\n'
@app.route('/final/<query>')
def doQuery(query):
    try:
        q=query.strip()
        if not q.endswith(';'):
            q+=';'
        cursor=engine.execute(q);
        logger.info('Returning {0} rows for query {0}'.format(
            cursor.rowcount,
            q
        ))
        return Response(generate(cursor), mimetype='application/json')
    except Exception, e:
        return Response(
            [json.dumps({'msg':str(e)}), '\n'],
            status='500 Server exception',
            mimetype='application/json')

if __name__=='__main__':
    engine.connect()
    app.run(host='0.0.0.0', port=20900)
