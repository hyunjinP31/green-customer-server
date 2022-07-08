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
//app.get('경로', callback함수)
//connection.query("쿼리문", callback함수)
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
    //req가 가진 값중 params 객체에 담긴 id라는 key를 id라는 변수로 바로 구조분해할당
    const {id} = req.params;
    connection.query(
        `select * from customers_table where no=${id}`,
        (err,rows)=>{
        res.send(rows[0]);
        if(!rows){
            console.log(err);
        }
    })
})

// addCustomers post요청이 오면 처리 req -> 요청하는 객체, res -> 응답하는 객체
// post 요청을 했을 때 실제로 필요한 데이터를 들고 있는 건 body 객체
// body: {
//     name: '김살몬',
//     phone: '01023456789',
//     birth: '2000-01-01',
//     gender: '여성',
//     add1: '울산 동구 살몬동',
//     add2: '살몬스퀘어 5층'
//   },
// mysql 쿼리 select / update / delete / insert
//  `INSERT INTO \`customerlist\`.\`customers_table\` (\`name\`, \`phone\`, \`birth\`, \`gender\`, \`add1\`, \`add2\`) VALUES ("${name}", "${phone}", "${birth}", "${gender}", "${add1}", "${add2}");`
// insert 간단하게 쓰기
// insert into 테이블 (컬럼1, 컬럼2, 컬럼3...) values(?,?,?)
// query("쿼리",[갑1,값2,값3,값4...], callback함수)
//ex> insert into customers_table(name, phone, birth, gender, add1, add2) values(?,?,?,?,?,?)

app.post('/addCustomers',async (req, res)=>{
    console.log(req);
    const body = req.body;
    const { name, phone, birth, gender, add1, add2 } = body;
    console.log(name, phone)
    connection.query(
       "insert into customers_table(name, phone, birth, gender, add1, add2) values(?,?,?,?,?,?)",
       [name, phone, birth, gender, add1, add2],
       (err, result)=>{
        console.log(result)
       }
    )
})
// 삭제요청시 처리
// /:뒤에 오는 값을 해당 이름으로 받겠다.
// delete from 테이블명 조건절
// delete from customers_table where no = no
app.delete('/delCustomers/:id', async (req)=>{
    const {id} = req.params;
    connection.query(
        `delete from customers_table where no=${id}`,
    )
})

//수정하기
//update 테이블 이름 set 컬럼명 = '값' where no = '값'
// update customers_table set name="",phone="", birth="", gender="",add1="",add2="" where no=""
app.put(`/updateCustomers/:id`, async (req,res)=>{
    //파라미터 값을 가지고 있는 객체를 구조분해할당으로 바로 받음
    const { id } = req.params;
    const { name, phone, birth, gender, add1, add2 } = req.body;
    connection.query(
        `update customers_table set name="${name}", phone="${phone}", birth="${birth}", gender="${gender}", add1="${add1}", add2="${add2}" where no="${id}" `,
        (err, result)=>{
            res.send(result);
            if(!result){
                console.log(err);
            }
        }
    )
})

//서버 실행
app.listen(port, ()=>{
    console.log("고객 서버가 돌아가고 있습니다.")
})
