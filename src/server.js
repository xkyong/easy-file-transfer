const path = require('path')
const os = require('os')

const Koa = require('koa')
const Router = require('koa-router')
const logger = require('koa-logger')
const cors = require('koa-cors')
const multer = require('@koa/multer')
const staticAssets = require('koa-static')
const iconv = require('iconv-lite')
const chalk = require('chalk')
const portfinder = require('portfinder')

// 设置基准端口
portfinder.setBasePort(5555)

const log = console.log

const processSize = (size) => {
  if (size / 1024 / 1024 >= 1) {
    return `${(size / 1024 / 1024).toFixed(2)}MB`
  } else if (size / 1024 >= 1) {
    return `${(size / 1024).toFixed(2)}KB`
  } else {
    return `${size}B`
  }
}

const app = new Koa()
const fileRouter = new Router({ prefix: '/file' })

const networkInterfaces  = os.networkInterfaces()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(process.cwd(), './uploads/'))
  },

  filename: (req, file, cb) => {
    let uploadName = iconv.decode(file.originalname, 'utf-8')
    cb(null, uploadName)
  }
})

// 处理form-data文件上传
const upload = multer({
  storage
})

fileRouter.post('/upload', upload.any(), async (ctx, next) => {
  try {
    let resMsg = ''

    ctx.request.files.forEach((fileInfo, index) => {
      log(chalk.green(`接收到的文件信息：${JSON.stringify(fileInfo, null, 2)}`))
      resMsg += `[${index + 1}]上传成功！\n存储位置：${fileInfo.path}；\n文件名：${fileInfo.filename}；\n文件大小：${processSize(fileInfo.size)}。\n`
    })

    ctx.body = resMsg
  } catch (error) {
    ctx.body = '上传失败，请重新上传！'
    log(chalk.red(`upload error: ${error.message}`))
  } finally {
    await next()
  }
})

app.use(cors())
app.use(logger())
app.use(staticAssets(path.resolve(__dirname, './')))
app.use(fileRouter.routes())
app.use(fileRouter.allowedMethods())

;(async () => {
  const port = await portfinder.getPortPromise()

  app.listen(port, () => {
    console.log(chalk.yellow('\nthe file server is available on:'))
    Object.keys(networkInterfaces).forEach((interfaceName) => {
      networkInterfaces[interfaceName].forEach((iface) => {
        if (iface.family === 'IPv4') {
          console.log((' ' + 'http://' + iface.address + ':' + chalk.green(port)))
        }
      })
    })
  })
})()
