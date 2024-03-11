const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

// console.log(process.env.DB_USER);
// console.log(process.env.DB_PASS);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dhjafvg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const foodCollection = client.db('foodDb').collection('food');
    const purchaseCollection = client.db('foodDb').collection('purchase');

    app.post('/food', async (req, res) => {
      const newFood = req.body;
      console.log(newFood);
      const result = await foodCollection.insertOne(newFood);
      res.send(result);
    })
   
    app.put('/food/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const foodInfo = req.body;
      const filter = { _id: new ObjectId(id) };
      // console.log(filter);
      const options = { upsert: true };
      const updatedProduct = {
        $set: {
          foodName: foodInfo.foodName,
          foodCategory: foodInfo.foodCategory          ,
          price: foodInfo.price,
          addByName: foodInfo.addByName,
          addByEmail: foodInfo.addByEmail,          
          shortDescription: foodInfo.shortDescription,       
          foodOrigin:foodInfo.foodOrigin,
          quantity : foodInfo.quantity
        },
      };
      const result = await foodCollection.updateOne(
        filter,
        updatedProduct,
        options
      );
      res.send(result);
    })

     
    app.get('/food', async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const result = await foodCollection
        .find()
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    })

    app.get("/foodCount", async (req, res) => {
      const count = await foodCollection.estimatedDocumentCount();
      res.send({ count });
    });

    app.get("/fooddetails/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.findOne(query);
      res.send(result);
    });

    app.post("/foodPurchase", async (req, res) => {
      const purchaseInfo = req.body;
      const id = purchaseInfo.id;
      const org_quantity = purchaseInfo.org;
      const filter = { _id: new ObjectId(id) };

      const infoPushToDb = {
        foodName: purchaseInfo.foodName,
        quantity: purchaseInfo.quantity,
        price: purchaseInfo.price,
        buyerMail: purchaseInfo.buyerMail,
        buyerName: purchaseInfo.buyerName,
        buyingDate: purchaseInfo.buyingDate,
      };

      const updatedDoc = {
        $set: {
          quantity: org_quantity - purchaseInfo.quantity
        }
      }
      const updateQuantity = await foodCollection.updateOne(filter, updatedDoc);
      if (updateQuantity.modifiedCount > 0) {
        const result = await purchaseCollection.insertOne(infoPushToDb);
        if (result.insertedId) {
          res.json({ success: true });
        }
      }
    });

    app.get('/allOrders', async (req, res) => {
      const result = await purchaseCollection.find().toArray();
      res.send(result);
    })

    app.get("/myOrder/:email", async (req, res) => {
      const email = req.params.email;
      const allOrder = await purchaseCollection.find().toArray();
      const myOrder = allOrder.filter((order) => order.buyerMail == email);
      res.send(myOrder);
    });

    app.delete("/removeItem/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await purchaseCollection.deleteOne(filter);
      res.send(result);
    });

    //myAddedFood
    app.get("/addedFoods/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const cursor = foodCollection.find();
      const allCart = await cursor.toArray();
      const result = allCart.filter(food => food.addByEmail == email);
      console.log(result);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






app.get('/', (req, res) => {
  res.send('Server is Running')
})
app.listen(port, () => {
  console.log(`Server is Running on Port: ${port}`);
})