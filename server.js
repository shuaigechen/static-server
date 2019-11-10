var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if (!port) {
    console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
    process.exit(1)
}

var server = http.createServer(function (request, response) {
    var parsedUrl = url.parse(request.url, true)
    var pathWithQuery = request.url
    var queryString = ''
    if (pathWithQuery.indexOf('?') >= 0) { queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
    var path = parsedUrl.pathname
    var query = parsedUrl.query
    var method = request.method

    /******** 从这里开始看，上面不要看 ************/

    console.log('有个傻子发请求过来啦！路径（带查询参数）为：' + pathWithQuery)

    response.statusCode = 200
    // 默认首页，如果path等于/，就默认x=index.html，否则 就等于path
    const filePath = path === '/' ? '/index.html' : path

    //lastIndexOf拿到子字符串的下标
    const index = filePath.lastIndexOf('.')//找到filePath子字符串 . 的下标
    // suffix 是后缀的单词
    const suffix = filePath.substring(index)//从 .的下标处获取子字符串，就是后缀
    const fileTypes = { //用哈希表，一一映射，把后缀变成需要的文本格式
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.png': 'image/png',
        '.img': 'image/jpeg'
    }
    response.setHeader('Content-type', `${fileTypes[suffix] || 'text/html'};charset=utf-8`)
    // 如果输入的后缀不在这几个之中，就用html当默认值
    let content
    try { //try表示不一定有错误
        content = fs.readFileSync(`./public${filePath}`)//文件路径
    } catch (error) { // 抓住这个错误
        content = '文件不存在'
        response.statusCode = 404
    }
    response.write(content)
    response.end()


    /******** 代码结束，下面不要看 ************/
})

server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)