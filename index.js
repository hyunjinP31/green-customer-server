const express = require("express");
const cors = require('cors');
const app = express();
const port = 3001;
const mysql = require("mysql");
//파일 읽어내릴 수 있도록 도와줌
const fs = require("fs");
//실제로 파일 받아옴
const dbinfo = fs.readFileSync('./database.json');
// 받아온 json데이터를 객체 형태로 변경 JSON.parse
const conf = JSON.parse(dbinfo);

// connection mysql 연결 : createConnection()
// connection.connect() 연결하기
// connection.end() : 연결 종료
//connection.query('쿼리문', callback함수)
//callback(error, result, result의 field 정보)


const connection = mysql.createConnection({
    host: conf.host,
    user: conf.user,
    password:conf.password,
    port: conf.port,
    database: conf.database,
});

app.use(express.json());
app.use(cors());

app.get('/customers', async (req, res)=>{
    //쿼리문 날려주기
    connection.query(
        "select * from customers_table",
        //결과받기
        (err, rows, fields)=>{
            res.send(rows)
            if(!rows){
                console.log(err);
            }
        }
    )
})

app.get('/customers/:id', async (req,res)=>{
    const {id} = req.params;
    connection.query(
        `select * from customers_table where no=${id}`,
        (err,rows)=>{
        res.send(rows);
        if(!rows){
            console.log(err);
        }
    })
})
app.post('/customers',async (req, res)=>{
    const body = req.body;
    const { name, phone, birth, gender, add1, add2 } = body;
    connection.query(
        `INSERT INTO \`customerlist\`.\`customers_table\` (\`name\`, \`phone\`, \`birth\`, \`gender\`, \`add1\`, \`add2\`) VALUES ("${name}", "${phone}", "${birth}", "${gender}", "${add1}", "${add2}");`
    )
})
app.delete('/customers/:id', async(req)=>{
    const {id} = req.params;
    connection.query(
        `delete from customers_table where no=${id}`
    )
})

//서버 실행
app.listen(port, ()=>{
    console.log("고객 서버가 돌아가고 있습니다.")
})