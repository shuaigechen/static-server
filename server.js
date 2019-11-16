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
    //读取文件，声明session = 使用JSON方法读取json文件
    const session = JSON.parse(fs.readFileSync('./session.json').toString())

    console.log('有个傻子发请求过来啦！路径（带查询参数）为：' + pathWithQuery)
    if (path === "/sign_in" && method === "POST") {
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        //先fs这个文件变得到字符串，然后用json变成字符串
        const userArray = JSON.parse(fs.readFileSync("./db/users.json"));
        //声明一个数组，存放数据
        const array = [];
        //监听请求的上传事件，获取上传的一小部分数据（chunk）
        request.on("data", chunk => {
            //把数据放到数组里
            array.push(chunk);
        });
        //监听请求的结束事件，
        request.on("end", () => {
            //Buffer把不同的东西合成一个字符串
            const string = Buffer.concat(array).toString();
            //把字符串变成对象
            const obj = JSON.parse(string);    //对象里面有你填写的name password
            //看我的数组里，有没有name password 跟你一样的
            //find查找数组里有没有符合要求的，find里面写一个函数，满足条件就返回true。对数组里面每一个user 查找name 和password 是否相等
            //如果有满足条件的，会返回满足条件第一个元素的值，user
            const user = userArray.find((user) => user.name === obj.name && user.password === obj.password)
            //如果user不存在，说明 用户名密码错误，返回一个json的错误状态码
            if (user === undefined) {
                response.statusCode = 400
                response.setHeader('Content-Type', 'text/json; charset=utf-8');
                response.end(`{"errorCode:4001}`)
                //对了就返回200
            } else {
                response.statusCode = 200
                //声明一个随机数，等于随机数函数
                const random = Math.random()
                //session[random]的值 = user_id: user.id
                session[random] = { user_id: user.id }
                //把session写到json文件里
                fs.writeFileSync('session.json', JSON.stringify(session))
                //如果用户名密码是对的，就写用户的id，是随机数 不让前端碰cookie
                response.setHeader('Set-Cookie', `session_id=${random}; 'HttpOnly'`)
            }
            response.end()
        });
    } else if (path === "/home.html") {
        //声明一个cookie 等于请求头里面的cookie
        const cookie = request.headers["cookie"];
        //声明 要找的sessionId
        let sessionId
        //尝试。进行下面的操作
        try {
            //先把cookie用split ; 得到一个数组，使用filter找到数组里等于session_id的东西，如果有就让它的下标大于等于0
            //[0]获取这个字符串，用split = 得到一个数组， session_id = 2，拿到下标1，就是2
            sessionId = cookie.split(';').filter(s => s.indexOf('session_id=') >= 0)[0].split('=')[1]
            //出错就什么也不做
        } catch (error) { }
        if (sessionId && session[sessionId]) {
            const userId = session[sessionId].user_id
            //先fs这个文件变得到字符串，然后用json变成字符串,找到所有的id
            const userArray = JSON.parse(fs.readFileSync("./db/users.json"));
            //声明一个user等于，在所有id里找（user=user.id变成字符串，=userId）
            const user = userArray.find(user => user.id === userId);
            //如果 用户存在，替换home文件
            const homeHtml = fs.readFileSync("./public/home.html").toString();
            let string = ''
            if (user) {
                //如果user存在，就替换为已登录，并把用户名告诉我
                string = homeHtml.replace("{{loginStatus}}", '已登录').replace('{{user.name}}', user.name)
            }
            response.write(string);
        } else {
            const homeHtml = fs.readFileSync("./public/home.html").toString();
            //替换为未登录，区分是否是注册账户
            const string = homeHtml.replace('{{loginStatus}}', '未登录').replace('{{user.name}}', '')
            response.write(string);
        }
        response.end()
    } else if (path === "/register" && method === "POST") {
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        //先fs这个文件变得到字符串，然后用json变成字符串
        const userArray = JSON.parse(fs.readFileSync("./db/users.json"));
        //声明一个数组，存放数据
        const array = [];
        //监听请求的上传事件，获取上传的一小部分数据（chunk）
        request.on("data", chunk => {
            //把数据放到数组里
            array.push(chunk);
        });
        //监听请求的结束事件，
        request.on("end", () => {
            //Buffer把不同的东西合成一个字符串
            const string = Buffer.concat(array).toString();
            //把字符串变成对象
            const obj = JSON.parse(string);
            //先获取到最后一个用户
            const lastUser = userArray[userArray.length - 1];
            const newUser = {
                //id为最后一个用户的id+1，如果最后一个用户存在就是加1，不存在就是1
                id: lastUser ? lastUser.id + 1 : 1,
                //名字和密码是对象的名字密码
                name: obj.name,
                password: obj.password
            };
            //把对象存到数据库里
            userArray.push(newUser);
            //把userArray变成字符串，然后fs到db的文件夹下
            fs.writeFileSync("./db/users.json", JSON.stringify(userArray));
            response.end()
        });
    } else {
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
    }
    /******** 代码结束，下面不要看 ************/
})

server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)