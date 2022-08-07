from datetime import datetime as dt
import config.config as config


def hour_conversion(hours):
    return hours*60*60


# Is lastID pool ID? This is to mitigate the long list of pools
def query(lastId):
    return """
            { 
                pools (first: 1000, where: {id_gt: %s, expiryTime_gte: "%s", expiryTime_lte: "%s", statusFinalReferenceValue: "Open", dataProvider: "%s"}) {
                    id
                    dataProvider
                    referenceAsset
                    floor
                    inflection
                    cap
                    statusFinalReferenceValue
                    expiryTime
                  }
                }
            """ % (lastId, (int(dt.now().timestamp()) - 86400), (int(dt.now().timestamp()) - 300), config.dataprovider)

def tellor_query(lastId):
    return """
            { 
                pools (first: 1000, where: {id_gt: %s, expiryTime_gte: "%s", expiryTime_lte: "%s", statusFinalReferenceValue: "Open", dataProvider: "%s"}) {
                    id
                    dataProvider
                    referenceAsset
                    floor
                    inflection
                    cap
                    statusFinalReferenceValue
                    expiryTime
                  }
                }
            """ % (lastId, (int(dt.now().timestamp()) - 86400), (int(dt.now().timestamp()) - 300), config.dataprovider)

def new_pool_query():
    return """
            { 
                pools (where: {dataProvider: "%s", createdAt_gte: "%s" }) {
                    id
                    dataProvider
                    referenceAsset
                    floor
                    inflection
                    cap
                    statusFinalReferenceValue
                    expiryTime
                    createdAt
                  }
                }
            """ % (config.dataprovider, (int(dt.now().timestamp()) - 30000))

# Notification period in hours


def pool_expiry(Notification_period_ceiling, Notification_period_floor=0):
    print(hour_conversion(Notification_period_ceiling))
    return """
            { 
                pools (where: {dataProvider: "%s", expiryTime_gte: "%s", expiryTime_lte: "%s" }) {
                    id
                    dataProvider
                    referenceAsset
                    floor
                    inflection
                    cap
                    statusFinalReferenceValue
                    expiryTime
                    createdAt
                  }
                }
            """ % (config.dataprovider, (int(dt.now().timestamp()) + hour_conversion(Notification_period_floor)), (int(dt.now().timestamp()) + hour_conversion(Notification_period_ceiling)))
