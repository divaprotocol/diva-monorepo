from datetime import datetime as dt
import config.config as config


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


def email_query():
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


def pool_expiry():
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
            """ % (config.dataprovider, (int(dt.now().timestamp())), (int(dt.now().timestamp()) + 300000))
