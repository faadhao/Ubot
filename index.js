import linebot from 'linebot'
import dotenv from 'dotenv'
import axios from 'axios'
import schedule from 'node-schedule'
import csv from 'csvtojson'

dotenv.config()

const bot = linebot({
  channelId: process.env.CHANNEL_ID,
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
})

let dataTaipei = []
let dataNewTaipei = []
let dataTaoyuan = []
const dataTaichung = []
const dataTainan = []

const updateData = async () => {
  const res1 = await axios.get('https://tcgbusfs.blob.core.windows.net/blobyoubike/YouBikeTP.json')
  const res2 = await axios.get(
    'https://data.ntpc.gov.tw/api/datasets/71CD1490-A2DF-4198-BEF1-318479775E8A/csv/file'
  )
  const res3 = await axios.get(
    'https://data.tycg.gov.tw/opendata/datalist/datasetMeta/download?id=5ca2bfc7-9ace-4719-88ae-4034b9a5a55c&rid=a1b4714b-3b75-4ff8-a8f2-cc377e4eaa0f'
  )
  const res4 = await axios.get('https://datacenter.taichung.gov.tw/swagger/OpenData/91deb8b8-7547-4a60-8cae-7c95c0df2fda')
  const res5 = await axios.get('http://tbike-data.tainan.gov.tw/Service/StationStatus/Json')
  dataTaipei = res1.data
  dataNewTaipei = await csv().fromString(res2.data)
  dataTaoyuan = res3.data
  for (const data of res4.data) {
    const station = {
      sna: data.Position,
      snaen: data.EName,
      ar: data.CAddress,
      sbi: data.AvailableCNT,
      bemp: data.EmpCNT,
      lat: parseFloat(data.Y),
      lng: parseFloat(data.X)
    }
    dataTaichung.push(station)
  }
  for (const data of res5.data) {
    const station = {
      sna: data.StationName,
      snaen: data.EnglishStationName,
      ar: data.Address,
      sbi: data.AvaliableBikeCount,
      bemp: data.AvaliableSpaceCount,
      lat: data.Latitude,
      lng: data.Longitude
    }
    dataTainan.push(station)
  }
}

const rule = new schedule.RecurrenceRule()
const time = [0, 15, 30, 45]
rule.minute = time
schedule.scheduleJob(rule, () => {
  updateData()
})
updateData()

bot.on('message', async (event) => {
  try {
    let reply = {
      type: 'flex',
      altText: 'flex message',
      contents: {
        type: 'carousel',
        contents: []
      }
    }

    if (event.message.type === 'location') {
      const address = event.message.address
      const latitude = event.message.latitude
      const longitude = event.message.longitude

      const addressCity = address.slice(5, 7)
      const latitude1 = latitude - 0.005
      const latitude2 = latitude + 0.005
      const longitude1 = longitude - 0.005
      const longitude2 = longitude + 0.005
      const stations = []

      console.log(addressCity)
      if (addressCity === '新北') {
        newTaipei(latitude1, latitude2, longitude1, longitude2, stations)
        for (const sta of stations) {
          reply.contents.contents.push(newreply(sta))
        }
        reply = reply.length === 0 ? '找不到資料' : reply
        event.reply(reply)
      } else if (addressCity === '台北') {
        Taipei(latitude1, latitude2, longitude1, longitude2, stations)
        for (const sta of stations) {
          reply.contents.contents.push(newreply(sta))
        }
        reply = reply.length === 0 ? '找不到資料' : reply
        event.reply(reply)
      } else if (addressCity === '桃園') {
        Taoyuan(latitude1, latitude2, longitude1, longitude2, stations)
        for (const sta of stations) {
          reply.contents.contents.push(newreply(sta))
        }
        reply = reply.length === 0 ? '找不到資料' : reply
        event.reply(reply)
      } else if (addressCity === '台中') {
        Taichung(latitude1, latitude2, longitude1, longitude2, stations)
        for (const sta of stations) {
          reply.contents.contents.push(newreply(sta))
        }
        reply = reply.length === 0 ? '找不到資料' : reply
        event.reply(reply)
      } else if (addressCity === '台南') {
        Tainan(latitude1, latitude2, longitude1, longitude2, stations)
        for (const sta of stations) {
          reply.contents.contents.push(newreply(sta))
        }
        reply = reply.length === 0 ? '找不到資料' : reply
        event.reply(reply)
      }
    } else if (event.message.type === 'text') {
      const text = event.message.text
      if (text === '!location') {
        reply = {
          type: 'text',
          text: '傳送你現在的位置',
          quickReply: {
            items: [
              {
                type: 'action',
                action: {
                  type: 'location',
                  label: '傳送位置'
                }
              }
            ]
          }
        }
        event.reply(reply)
      } else {
        event.reply('我聽不懂你在說什麼唷!')
      }
    }
  } catch (error) {
    event.reply('發生了錯誤')
    console.log(error)
  }
})

bot.listen('/', process.env.PORT, () => {
  console.log('機器人已啟動')
})

const newTaipei = (lat1, lat2, lng1, lng2, sta) => {
  for (const station of dataNewTaipei) {
    if (parseFloat(station.lat) >= lat1 && parseFloat(station.lat) <= lat2 && parseFloat(station.lng) >= lng1 && parseFloat(station.lng) <= lng2 && station.act === '1') {
      sta.push(station)
    }
  }
  return sta
}

const Taipei = (lat1, lat2, lng1, lng2, sta) => {
  for (const num in dataTaipei.retVal) {
    if (parseFloat(dataTaipei.retVal[num].lat) >= lat1 && parseFloat(dataTaipei.retVal[num].lat) <= lat2 && parseFloat(dataTaipei.retVal[num].lng) >= lng1 && parseFloat(dataTaipei.retVal[num].lng) <= lng2 && dataTaipei.retVal[num].act === '1') {
      sta.push(dataTaipei.retVal[num])
    }
  }
  return sta
}

const Taoyuan = (lat1, lat2, lng1, lng2, sta) => {
  for (const num in dataTaoyuan.retVal) {
    if (parseFloat(dataTaoyuan.retVal[num].lat) >= lat1 && parseFloat(dataTaoyuan.retVal[num].lat) <= lat2 && parseFloat(dataTaoyuan.retVal[num].lng) >= lng1 && parseFloat(dataTaoyuan.retVal[num].lng) <= lng2 && dataTaoyuan.retVal[num].act === '1') {
      sta.push(dataTaoyuan.retVal[num])
    }
  }
  return sta
}

const Taichung = (lat1, lat2, lng1, lng2, sta) => {
  for (const station of dataTaichung) {
    if (station.lat >= lat1 && station.lat <= lat2 && station.lng >= lng1 && station.lng <= lng2) {
      sta.push(station)
    }
  }
  return sta
}

const Tainan = (lat1, lat2, lng1, lng2, sta) => {
  for (const station of dataTainan) {
    if (station.lat >= lat1 && station.lat <= lat2 && station.lng >= lng1 && station.lng <= lng2) {
      sta.push(station)
    }
  }
  return sta
}

const newreply = (sta) => {
  return {
    type: 'bubble',
    size: 'kilo',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: sta.sna,
          weight: 'bold',
          size: 'xl',
          wrap: true,
          color: '#ffffff'
        },
        {
          type: 'text',
          text: sta.snaen,
          size: 'xs',
          color: '#ffffff',
          wrap: true
        },
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                {
                  type: 'text',
                  text: '地址:',
                  wrap: true,
                  color: '#acacac',
                  size: 'sm',
                  flex: 2
                },
                {
                  type: 'text',
                  text: sta.ar,
                  flex: 5,
                  size: 'sm',
                  wrap: true,
                  color: '#ffffff'
                }
              ]
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                {
                  type: 'text',
                  text: '可借車位數:',
                  wrap: true,
                  color: '#acacac',
                  size: 'sm',
                  flex: 7
                },
                {
                  type: 'text',
                  text: `${sta.sbi}`,
                  flex: 5,
                  size: 'sm',
                  color: '#ffffff'
                }
              ]
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                {
                  type: 'text',
                  text: '可還空位數:',
                  wrap: true,
                  color: '#acacac',
                  size: 'sm',
                  flex: 7
                },
                {
                  type: 'text',
                  text: `${sta.bemp}`,
                  flex: 5,
                  size: 'sm',
                  color: '#ffffff'
                }
              ]
            }
          ]
        }
      ],
      spacing: 'sm',
      paddingAll: '13px'
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'button',
          action: {
            type: 'uri',
            label: '地圖',
            uri: `https://maps.google.com/?q=${sta.lat},${sta.lng}`
          },
          style: 'link',
          height: 'sm',
          color: '#ffffff'
        }
      ]
    },
    styles: {
      body: {
        backgroundColor: '#464F69'
      },
      footer: {
        backgroundColor: '#464F69',
        separator: true
      }
    }
  }
}
