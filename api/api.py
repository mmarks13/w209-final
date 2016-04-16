#!/usr/bin/python
from flask import Flask, Response,  request, send_from_directory
from flask.ext.cors import CORS
from flask_limiter import Limiter

import ujson as json
import logging
import gdal
import sqlalchemy
from geopy.geocoders import Nominatim
import pyproj
import numpy as np

app=Flask('w209dbapi')
CORS(app)
limiter = Limiter(
    app,
    key_func=lambda: '1' # for all users
)
engine = sqlalchemy.create_engine('mysql://reader@localhost/final', echo=True)
logger = logging.getLogger('w209dbapi')
geolocator=Nominatim(country_bias='US', user_agent="student final project: UC-B MIDS W209: Data Visualization contact: nk@ischool.berkeley.edu")


@app.route('/')
def root():
        return Response(
            ["Go away"],
            mimetype='text/plain')


def generate(query):
    err=''
    yield '{"data": ['
    try:
        cursor=engine.execute(query)
        pfx=''
        while True:
            rows=cursor.fetchmany()
            if not rows:
                break
            for row in rows:
                yield  pfx+json.dumps(dict(row.items()))
                if not pfx:
                    pfx=','
    except Exception,e:
        err=',"error":' + json.dumps(str(e))
    finally:
        yield ']'+err+'}\n'

@app.route('/sql')
def doQuery():
    try:
        query=request.values['query'].strip()
        if not query.endswith(';'):
            query+=';'
        return Response(generate(query), mimetype='application/json')
    except Exception, e:
        return Response(
            [json.dumps({'error': str(e)}), '\n'],
            status='500 Server exception',
            mimetype='application/json')

def fakeQuery(filename):
    return Response(
        '{'+'"data":{data},"err":""'.format(
            data=open(filename).read())+'}',
        status='200 OK',
        mimetype='application/json')


@app.route('/mainTable/')
@app.route('/mainTable/<physician>')
def mainTable(physician=None):
    if 'real' not in request.values:
        return fakeQuery('Main_Table_Lens_Data.json');
    if physician:
        where='WHERE PhysicianProfileID={physician}'.format(physician=physician)
    else:
        where=''
    return doQuery(
'''SELECT 
    DrugName,
    NameOfAssociatedCoveredDrugOrBiological1 as RxBrand,
    NDCOfAssociatedCoveredDrugOrBiological1  as RxNDC,
    TotalClaimCountAgg                       as RxCount,
    NumberOfPaymentsIncludedInTotalAmountAgg as PaymentCount,
    AmountOfPaymentUSDollarsAgg              as PaymentTotal
FROM OpenPaymentPrescrJoin4
GROUP BY PhysicianProfileID
{where};'''.format(where=where))


@app.route('/hoverTable/<physician>')
def hoverTable(physician):
    return fakeQuery('Hover_Table_Lens_Data.json');
    return doQuery(
'''SELECT 
    DrugName,
    NameOfAssociatedCoveredDrugOrBiological1 as RxBrand,
    NDCOfAssociatedCoveredDrugOrBiological1  as RxNDC,
    TotalClaimCountAgg                       as RxCount,
    NumberOfPaymentsIncludedInTotalAmountAgg as PaymentCount,
    AmountOfPaymentUSDollarsAgg              as PaymentTotal
FROM OpenPaymentPrescrJoin4
WHERE PhysicianProfileID={physician} ;'''.format(physician=physician))


@app.route('/histogramData/<column>/')
@app.route('/histogramData/<column>/<drug>')
def StripPlot(column,drug = None):
    return Response(json.dumps(val={
  'data': np.random.randint(0,10000,1000).tolist(),
  'error': None
    }), status='200 OK'); 
    if drug:
        where='WHERE drug={drug}'.format(drug=drug)
    else:
        where=''
    return doQuery(
'''SELECT 
sum(case when {column} is null then 0 Else {column} End) as Count
from OpenPaymentPrescrJoin4
group by PhysicianProfileID
{where}
order by sum(case when {column} is null then 0 Else {column} End) asc;'''.format(where=where, column = column)) 




# This call enforces a rate limit of 1 per second to conform to OSM
# Nominatim terms of use.  UI should restrict subsequent calls based
# on the Retry-After response header, and can see the rate limit
# params in X-RateLimit-* headers
@limiter.shared_limit('1 per second', 'nominatim')
@app.route('/locate/<loc>')
def locate(loc):
    return Response(
        [json.dumps(geolocator.geocode(loc, geometry='wkt'))],
        status='203 Non-Authoritative Information from OSM Nominatim',
        mimetype='application/json')
    
@limiter.shared_limit('1 per second', 'nominatim')
@app.route('/near/<lat>/<lon>/<radius>')
def near(lat, lon, distance):
    doQuery("""SELECT zip,ST_ASTEXT(loc)
FROM final.ZipLoc 
WHERE ST_WITHIN(loc, ST_BUFFER(POINT({lat},{lon}), {degs};"""
            .format(lat=lat, lon=lon, degs=radius/69))


if __name__=='__main__':
    engine.connect()
    app.run(host='0.0.0.0', port=20900, debug=True)
