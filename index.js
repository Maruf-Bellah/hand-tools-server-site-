const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uhe8x.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
     const authHeader = req.headers.authorization;
     if (!authHeader) {
          return res.status(401).send({ message: 'UnAuthorized access' })
     }
     const token = authHeader.split(' ')[1];
     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
          if (err) {
               return res.status(403).send({ message: 'Forbidden access' })
          }
          req.decoded = decoded;
          next()
     });
}



async function run() {

     try {
          await client.connect();

          const serviceCollection = client.db('tools_menu').collection('services');
          const addressCollection = client.db('tools_menu').collection('address');
          const userCollection = client.db('tools_menu').collection('users');
          const productCollection = client.db('tools_menu').collection('product');

          app.get('/service', async (req, res) => {
               const query = {};
               const cursor = serviceCollection.find(query);
               const services = await cursor.toArray();
               res.send(services);
          });

          app.get('/service', verifyJWT, async (req, res) => {
               const email = req.query.email;
               const decodedEmail = req.decoded.email;
               if (email === decodedEmail) {
                    const query = { email: email };
                    const cursor = serviceCollection.find(query);
                    const services = await cursor.toArray();
                    return res.send(services);
               }
               else {
                    return res.status(403).send({ message: 'forbidden access' })
               }

          });

          app.post('/address', async (req, res) => {
               const address = req.body;
               const result = await addressCollection.insertOne(address);
               res.send(result)
          })
          // all users
          app.get('/user', async (req, res) => {
               const users = await userCollection.find().toArray();
               res.send(users)
          })



          app.put('/user/admin/:email', async (req, res) => {
               const email = req.params.email;
               const filter = { email: email };
               const updateDoc = {
                    $set: { role: 'admin' },
               };
               const result = await userCollection.updateOne(filter, updateDoc);
               res.send(result)
          })

          app.get('/admin/:email', async (req, res) => {
               const email = req.params.email;
               const user = await userCollection.findOne({ email: email });
               const isAdmin = user.role === 'admin';
               res.send({ admin: isAdmin })
          })





          app.put('/user/:email', async (req, res) => {
               const email = req.params.email;
               const user = req.body;
               const filter = { email: email };
               const options = { upsert: true };
               const updateDoc = {
                    $set: user,
               };
               const result = await userCollection.updateOne(filter, updateDoc, options);
               const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
               res.send({ result, token })
          })

          // product send mongodb
          app.get('/product', async (req, res) => {
               const products = await productCollection.find().toArray();
               res.send(products)
          })


          app.post('/product', async (req, res) => {
               const product = req.body;
               const result = await productCollection.insertOne(product);
               res.send(result)
          })

          app.delete('/product/:id', async (req, res) => {
               const id = req.params.id;
               const filter = { _id: ObjectId(id) };
               const result = await productCollection.deleteOne(filter);
               res.send(result)
          })

     }
     finally {

     }
}
run().catch(console.dir)


app.get('/', (req, res) => {
     res.send('Hello Parts Mama');
})

app.listen(port, () => {
     console.log('Listen Parts Mama Now', port);
})