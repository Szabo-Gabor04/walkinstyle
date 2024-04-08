const express = require("express");
const app = express();
const path = require('path');
const bodyParser = require("body-parser");
var cors = require("cors");
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

var mysql = require("mysql");

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "cipo"
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

app.use(express.static("web"));
const port = 3001;
app.listen(port, () => console.log(`Server running on port ${port}!`));
function CreateLinkId(item) {
  var newI = "";
  item.split("").forEach((i) => {
    newI += ekezetCheck(i);
  });

  return newI.split(" ").join("_").toLowerCase();
}

function ekezetCheck(item) {
  let enabledCharacters = [
    "a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","0","1","2","3","4","5","6","7","8","9"," ",
  ];

  let chHU = ["á", "é", "í", "ó", "ö", "ő", "ú", "ü", "ű"];
  let chEN = ["a", "e", "i", "o", "o", "o", "u", "u", "u"];
  let o = 0;
  while (o < chHU.length && chHU[o] != item.toLowerCase()) {
    o++;
  }
  if (o == chHU.length) {
    return enabledCharacters.includes(item.toLowerCase()) ? item : "";
  }

  return chEN[o];
}
app.get("/", (req, res) => {
    const filePath = path.resolve("web", 'index.html');
    res.sendFile(filePath); 
})

app.get("/kapcsolat", (req, res) => {
  const filePath = path.resolve("web", 'kapcsolat.html');
  res.sendFile(filePath); 
})
app.get("/partnereink", (req, res) => {
  const filePath = path.resolve("web", 'partnereink.html');
  res.sendFile(filePath); 
})

app.get("/rendeles", (req, res) => {
  const filePath = path.resolve("web", 'rendeles.html');
  res.sendFile(filePath); 
})

app.get("/kosar", (req, res) => {
  const filePath = path.resolve("web", 'kosar.html');
  res.sendFile(filePath); 
})

app.get("/termek", (req, res) => {
  const filePath = path.resolve("web", 'termek.html');
  res.sendFile(filePath); 
})

app.get("/controlpanel", (req, res) => {
  const filePath = path.resolve("web/controlpanel", 'index.html');
  res.sendFile(filePath); 
})
app.post("/uploadproduct", (req, res) => {
  try {
    const { banner, pName, pDescr, discountprice, price, categoryId, attrs } =
      req.body;
    const linkId = CreateLinkId(pName);
    //pl: Nike Air Jorden => nike_air_jorden
    var sql = `INSERT INTO products (pName,pDescr,linkId,categoryId,upload_date,discountprice,price,banner,attrId) VALUES ("${pName}", "${pDescr}", "${linkId}", ${categoryId}, "${new Date().toISOString().split('T').join(' ').split('.')[0]}", ${discountprice}, ${price}, '${banner}', ${attrs})`;
    con.query(sql, function (err, result) {
      if (err) {
        throw err;
      }
    });
  } catch (Err) {
    res.sendStatus(400);
  }
})
app.post("/createcategory", (req, res) => {
  try {
    const {name} = req.body;
    var sql = `INSERT INTO categories (name) VALUES ("${name}")`;
    con.query(sql, function (err, result) {
      if (err) {
        throw err;
      }
    });
  } catch (Err) {
    res.sendStatus(400);
  }
})
app.get("/getProductByLInkId/:linkid", (req, res) => {
    con.query(`SELECT * FROM products INNER JOIN attributes ON attributes.id = products.attrId WHERE linkId like "${req.params.linkid}"`, function (err, result, fields) {
        if (err) {
            res.sendStatus(500); 
            return console.log(err);
        }
        if(result.length == 0){
          res.sendStatus(404);
          return;
        }
        res.json(result); 
    });
});
app.get("/getProductById/:id", (req, res) => {
  
  con.query(`SELECT * FROM products INNER JOIN attributes ON attributes.id = products.attrId WHERE products.id like ${req.params.id}`, function (err, result, fields) {
      if (err) {
          res.sendStatus(500); 
          return console.log(err);
      }
      if(result.length == 0){
        res.sendStatus(404);
        return;
      }
      res.json(result); 
  });
});
app.get("/search/:q", (req, res) => {
  con.query(`SELECT pName, id, linkId FROM products WHERE pName like "%${req.params.q}%" OR pDescr like "%${req.params.q}%"`, function (err, result, fields) {
      if (err) {
          res.sendStatus(500); 
          return console.log(err);
      }
      res.json(result); 
  });
});
app.get("/getallcetegory", (req, res) => {
  con.query(`SELECT * FROM categories`, function (err, result, fields) {
      if (err) {
          res.sendStatus(500); 
          return console.log(err);
      }
      res.json(result); 
  });
});
app.get("/getProductsByCategory/:id", (req, res) => {
  con.query(`SELECT *, categories.name AS "categoryName" FROM products INNER JOIN categories ON products.categoryId = categories.id INNER JOIN attributes ON attributes.id = products.attrId WHERE products.categoryId like ${req.params.id}`, function (err, result, fields) {
      if (err) {
          res.sendStatus(500); 
          return console.log(err);
      }
      res.json(result); 
  });
});

const adminLoginDatas = [{username: "valami", password: "valami"}]; // több fiók érdekében
app.post("/adminlogin", (req, res) => {
  try{
    const {username, password} = req.body;
    const user = adminLoginDatas.filter(i => i.username == username && i.password == password);
    if(user.length == 0){
      res.sendStatus(400);
      return;     
    }
    res.send(user);
  }catch(err){
    res.sendStatus(204); //No content
  }
})

app.get("/getNews", (req, res) => {
  con.query(`SELECT * FROM products ORDER BY upload_date DESC LIMIT 3`, function (err, result, fields) {
      if (err) {
          res.sendStatus(500); 
          return console.log(err);
      }
      if(result.length == 0){
        res.sendStatus(404);
        return;
      }
      res.json(result); 
  });
});
app.get("/getAllProduct", (req, res) => {
  con.query(`SELECT * FROM products ORDER BY upload_date DESC`, function (err, result, fields) {
      if (err) {
          res.sendStatus(500); 
          return console.log(err);
      }
      if(result.length == 0){
        res.sendStatus(404);
        return;
      }
      res.json(result); 
  });
});



