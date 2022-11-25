from datetime import datetime as dt
import config.config as config


def hour_conversion(hours):
    return hours*60*60

def seconds_to_hours(seconds):
    return seconds/(60*60)

# Is lastID pool ID? This is to mitigate the long list of pools
def query(lastId):
    expiry_floor_time_away = 300 # TODO Move to config
    expiry_cieling_time_away = config.max_reporting_frame * 3600 * 7 # drop and use submissionPeriod field in subgraph
    # currentTime <= expiryTime + submissionPeriod
    #print("pools expiring between {} hours and  {} hours from now:{}".format(expiry_floor_time_away/(60*60), expiry_cieling_time_away/(60*60), dt.now()))
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
                    submissionPeriod
                  }
                }
            """ % (lastId, (int(dt.now().timestamp()) - expiry_cieling_time_away), (int(dt.now().timestamp()) - expiry_floor_time_away),  config.dataprovider)

# collateral token is need to query and get price from Kraken


def tellor_query(lastId, provider):
    expiry_floor_time_away = 300 # TODO Move to config
    eft = seconds_to_hours(expiry_floor_time_away)
    expiry_ceiling_time_away = config.max_reporting_frame * 3600 * 7 # drop and use submissionPeriod field in subgraph
    # currentTime <= expiryTime + submissionPeriod
    ect = seconds_to_hours(expiry_ceiling_time_away)
    #print("pools expiring between {} hours and  {} hours from now: {}".format(round(eft, 2), ect, dt.now()))
    return """
            { 
                pools (first: 1000, where: {id_gt: %s, expiryTime_gte: "%s", expiryTime_lte: "%s",  statusFinalReferenceValue: "Open", dataProvider: "%s"}) {
                    id
                    dataProvider
                    referenceAsset
                    floor
                    inflection
                    cap
                    statusFinalReferenceValue
                    expiryTime
                    submissionPeriod
                    collateralToken {
                        symbol
                        id
                    }
                  }
                }
            """ % (lastId, (int(dt.now().timestamp()) - expiry_ceiling_time_away), (int(dt.now().timestamp()) - expiry_floor_time_away),  provider)


'''  collateralToken {
                        symbol
                        name
                        id
                    }'''


def new_pool_query():
    return """
            { 
                pools (where: {dataProvider: "%s", createdAt_gte: "%s" }) {
                    id
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
