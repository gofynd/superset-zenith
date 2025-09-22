# export SUPERSET=https://superset.intelligence.fynd.com
export SUPERSET=https://superset.intelligence.sit.fyndx1.de
export RUN_MANIFEST_LOCAL=true
# export BOLTIC_STREAMS_METHODS=trackSubmit,trackClick,trackLink,trackForm,pageview,identify,reset,group,track,ready,alias,debug,page,once,off,on,addSourceMiddleware,addIntegrationMiddleware,setAnonymousId,addDestinationMiddleware
export BOLTIC_STREAMS_KEY=Zc7Og8DXevJG85xZyjKPJBAgkOITWUdtpDB8EsyQWxyx8JgqZIsGz-smhWqpsCcLJ0_wPw-3_NMkljT0x1SLsQ
export BOLTIC_STREAMS_CHART_TRIGGER_THRESHOLDS=[{"chartId":152,"threshold":330000},{"chartId":248,"threshold":10000}]

npm run dev-server -- --port=9001
