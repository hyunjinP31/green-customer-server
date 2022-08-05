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
const bcrypt = require('bcrypt');
const saltRounds = 10;
const multer = require('multer');



// connection mysql 연결 : createConnection()
// connection.connect() 연결하기
// connection.end() : 연결 종료
//connection.query('쿼리문', callback함수)
//callback(error, result, result의 field 정보)


const connection = mysql.createConnection({
    host: conf.host,
    user: conf.user,
    password: conf.password,
    port: conf.port,
    database: conf.database,
});

app.use(express.json());
app.use(cors());
app.use("/upload", express.static('upload'));

const storage = multer.diskStorage({
    destination: "./upload",
    filename: function(req, file, cb){
        cb(null, file.originalname);
    }
})

const upload = multer({
    storage: storage,
    limits: { fieldSize: 1000000 }
})

//upload 경로로 포스트 요청이 왔을 때 응답
app.post('/upload', upload.single("img"), function(req, res, next){
    res.send({
        imageUrl: req.file.filename
    })
})



//app.get('경로', callback함수)
//connection.query("쿼리문", callback함수)
app.get('/customers', async (req, res) => {
    //쿼리문 날려주기
    connection.query(
        "select * from customers_table",
        //결과받기
        (err, rows, fields) => {
            res.send(rows)
            if (!rows) {
                console.log(err);
            }
        }
    )
})



app.get('/customers/:id', async (req, res) => {
    //req가 가진 값중 params 객체에 담긴 id라는 key를 id라는 변수로 바로 구조분해할당
    const { id } = req.params;
    connection.query(
        `select * from customers_table where no=${id}`,
        (err, rows) => {
            res.send(rows[0]);
            if (!rows) {
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

app.post('/addCustomers', async (req, res) => {
    console.log(req);
    const body = req.body;
    const { name, phone, birth, gender, add1, add2 } = body;
    console.log(name, phone)
    connection.query(
        "insert into customers_table(name, phone, birth, gender, add1, add2) values(?,?,?,?,?,?)",
        [name, phone, birth, gender, add1, add2],
        (err, result) => {
            console.log(result)
        }
    )
})
// 삭제요청시 처리
// /:뒤에 오는 값을 해당 이름으로 받겠다.
// delete from 테이블명 조건절
// delete from customers_table where no = no
app.delete('/delCustomers/:id', async (req) => {
    const { id } = req.params;
    connection.query(
        `delete from customers_table where no=${id}`,
    )
})

//수정하기
//update 테이블 이름 set 컬럼명 = '값' where no = '값'
// update customers_table set name="",phone="", birth="", gender="",add1="",add2="" where no=""
app.put(`/updateCustomers/:id`, async (req, res) => {
    //파라미터 값을 가지고 있는 객체를 구조분해할당으로 바로 받음
    const { id } = req.params;
    const { name, phone, birth, gender, add1, add2 } = req.body;
    connection.query(
        `update customers_table set name="${name}", phone="${phone}", birth="${birth}", gender="${gender}", add1="${add1}", add2="${add2}" where no="${id}" `,
        (err, result) => {
            res.send(result);
            if (!result) {
                console.log(err);
            }
        }
    )
})
//회원가입 요청
app.post('/join', async (req, res) => {
    //암호화 하기 전의 패스워드
    let myPlanintextPass = req.body.userpass;
    //암호화 한 패스워드를 담을 변수
    let myPass = "";
    if (myPlanintextPass != '' && myPlanintextPass != undefined) {
        bcrypt.genSalt(saltRounds, function (err, salt) {
            bcrypt.hash(myPlanintextPass, salt, function (err, hash) {
                // Store hash in your password DB.
                myPass = hash;
                const { username, userphone, userorg, usermail } = req.body;
                //쿼리작성
                connection.query(
                    `insert into customers_member (username, userpass, userphone, userorg, usermail, regdate) values 
        (?,?,?,?,?,DATE_FORMAT(now(),'%Y-%m-%d'))`,
                    [username, myPass, userphone, userorg, usermail],
                    (err, result, fields) => {
                        console.log(result);
                        console.log(err);
                        res.send("등록되었습니다.")
                    }
                )
            });
        });
    }
})

//로그인 요청
app.post('/login', async (req, res)=>{
    //usermail값에 일치하는 데이터가 있는지 select문
    //userpass 암호화해서 쿼리 결과의 패스워드랑 일치하는지를 체크
    const {usermail, userpass} = req.body;
    connection.query(`select * from customers_member where usermail = '${usermail}'`,
    (err, rows)=>{
        if(rows != undefined){
            if(rows[0] == undefined){
                res.send(null);
            }else{
                bcrypt.compare(userpass, rows[0].userpass, function(err, result) {
                    if(result ==  true){
                        res.send(rows[0])
                    }else{
                        res.send("실패")
                    }
                });
            }
        }else{
            res.send(null);
        }
    })
})

app.post('/gallery', async ( req, res )=> {
    const { usermail, title, imgurl, desc }= req.body;
    connection.query(
        "insert into customer_gallery (`title`, `imgUrl`,`desc`,`usermail`) value(?,?,?,?)",
        [title, imgurl, desc, usermail] ,
        (err, result)=>{
            res.send("등록완료");
        }
    )
})
//gallery 겟 요청시
app.get("/gallerylist", async (req, res)=>{
    connection.query("select * from customer_gallery",
    (err, result)=>{
        res.send(result);
    })
})

//서버 실행
app.listen(port, () => {
    console.log("고객 서버가 돌아가고 있습니다.")
})
