const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

//Middlewares
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const run = async () => {
  try {
    // Connect to the "hireloop-job-portal" database and access its "jobs" collection
    const database = client.db("hireloop-job-portal");
    const jobs = database.collection("jobs");

    // Add new job
    app.post("/jobs", async (req, res) => {
      const job = req.body;
      const result = await jobs.insertOne(job);
      res.send(result);
    });

    // Get all jobs
    app.get("/jobs", async (req, res) => {
      const job = req.body;
      const result = await jobs.find(job).toArray();
      res.send(result);
    });

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
};
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to the Hire-Loop Job Portal API!");
});

app.listen(port, () => {
  console.log(`hire-loop job portal server is running on port ${port}`);
});
