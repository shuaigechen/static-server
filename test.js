const fs = require("fs"); //获取数据库的内容

//读数据库
// 读取这个文件，得到一个字符串
const usersString = fs.readFileSync("./db/users.json").toString();
// JSON.parse可以把字符串变成 对应的数组对象
const usersArray = JSON.parse(usersString);
console.log(usersArray);

//写数据库
const users = { id: 3, name: 'tom', password: 'yyy' }//创建数据3
usersArray.push(users)
//把js的对象变成string，好存入数据库中
const string = JSON.stringify(usersArray)
//把内容（string）写到数据库里
fs.writeFileSync('./db/users.json', string)