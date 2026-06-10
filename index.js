const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Connect to the "hireloop-job-portal" database and access its "jobs" collection
    const database = client.db("hireloop-job-portal");
    const jobCollection = database.collection("jobs");
    const companyCollection = database.collection("companies");
    const usersCollection = database.collection("user");
    const applicationCollection = database.collection("application");
    const plansCollection = database.collection("plans");
    const subscriptionCollection = database.collection("subscription");

    // User Related API

    app.get("/api/users", async (req, res) => {
      const query = {};
      if (req.query.email) {
        query.email = req.query.email;
      }
      const cursor = usersCollection.find(query);
      const result = await cursor.toArray();
      console.log(result);
      res.send(result);
    });
    // plans
    app.get("/api/plans", async (req, res) => {
      const query = {};
      if (req.query.planId) {
        query.id = req.query.planId;
      }
      const cursor = plansCollection.find(query);
      const result = await cursor.toArray();
      console.log(result);
      res.send(result);
    });

    // subscription
    app.post("/api/subscription", async (req, res) => {
      try {
        const subscriptionData = req.body;
        const newSubscription = {
          ...subscriptionData,
          createdAt: new Date(),
        };
        const result = await subscriptionCollection.insertOne(newSubscription);
        // Update the user Info
        const filter = { email: subscriptionData.email };
        const updateDoc = {
          $set: {
            plan: subscriptionData.planId,
          },
        };
        const userUpdateResult = await usersCollection.updateOne(
          filter,
          updateDoc,
        );
        res.send({ result, userUpdateResult });
      } catch (error) {
        console.error("Error inserting subscription:", error);
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    // Application related api==================

    app.get("/api/application", async (req, res) => {
      const query = {};
      if (req.query.applicantId) {
        query.applicantId = req.query.applicantId;
      }
      if (req.query.jobId) {
        query.jobId = req.query.jobId;
      }
      const cursor = applicationCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    //
    app.post("/api/application", async (req, res) => {
      try {
        const applicationData = req.body;
        const newApplication = {
          ...applicationData,
          createdAt: new Date(),
        };
        const result = await applicationCollection.insertOne(newApplication);

        res.send(result);
      } catch (error) {
        console.error("Error inserting application:", error);
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    //  jobs related api ========================================

    // get details of a single job by jobId
    app.get("/api/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const job = await jobCollection.findOne(query);
      res.send(job);
    });

    // Get jobs by companyId and status and all job data
    app.get("/api/jobs", async (req, res) => {
      const query = {};
      if (req.query.companyId) {
        query.companyId = req.query.companyId;
      }
      if (req.query.status) {
        query.status = req.query.status;
      }
      const cursor = jobCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Add new job
    app.post("/api/jobs", async (req, res) => {
      const job = req.body;
      const newJob = {
        ...job,
        createdAt: new Date(),
      };
      const result = await jobCollection.insertOne(newJob);
      res.send(result);
    });

    // company related api ========================================

    // get all company
    app.get("/api/companies", async (req, res) => {
      const query = {};
      if (req.query.recruiterId) {
        query.recruiterId = req.query.recruiterId;
      }
      const cursor = companyCollection.find(query);
      const result = await cursor.toArray();
      console.log(result);
      res.send(result);
    });

    // Get companies by recruiterId
    app.get("/api/my/companies", async (req, res) => {
      const query = {};
      if (req.query.recruiterId) {
        query.recruiterId = req.query.recruiterId;
      }
      const cursor = companyCollection.find(query);
      const result = await cursor.toArray();
      console.log(result);
      res.send(result);
    });
    // Add new Company
    app.post("/api/companies", async (req, res) => {
      const company = req.body;
      const newCompany = {
        ...company,
        createdAt: new Date(),
      };
      const result = await companyCollection.insertOne(newCompany);
      res.send(result);
    });

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
