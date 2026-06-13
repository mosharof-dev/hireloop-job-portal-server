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

const logger = (req, res, next) => {
  console.log("inside logger", req.params);
  next();
};

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
    const sessionsCollection = database.collection("session");

    // verify token
    const verifyToken = async (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = authHeader.split(" ")[1];
      if (!token) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const query = { token: token };
      const session = await sessionsCollection.findOne(query);
      // if (!session) {
      //   return res.status(401).send({ message: "unauthorized access" });
      // }
      const userId = session.userId;

      const userQuery = {
        _id: userId,
      };
      const user = await usersCollection.findOne(userQuery);

      console.log("from verify token user: ", user);

      // if (!user) {
      //   return res.status(401).send({ message: "unauthorized access" });
      // }
      req.user = user;

      next();
    };

    // verify seeker must be used after verifyToken
    const verifySeeker = async (req, res, next) => {
      if (!req.user) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const user = req.user;
      if (user.role !== "seeker") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    // // verify recruiter must be used after verifyToken
    const verifyRecruiter = async (req, res, next) => {
      if (!req.user) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const user = req.user;
      if (user.role !== "recruiter") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    const verifyAdmin = async (req, res, next) => {
      if (!req.user) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };
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

    app.get("/api/application", verifyToken, verifySeeker, async (req, res) => {
      const query = {};
      if (req.query.applicantId) {
        query.applicantId = req.query.applicantId;
      }
      console.log(req.user, req.query.applicantId);
      if (req.query.applicantId !== req.user._id.toString()) {
        return res.status(403).send({ message: "forbidden access" });
      }
      if (req.query.jobId) {
        query.jobId = req.query.jobId;
      }
      const cursor = applicationCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // add application
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
    app.get("/api/companies", verifyToken, async (req, res) => {
      const query = {};
      if (req.query.recruiterId) {
        query.recruiterId = req.query.recruiterId;
      }
      const cursor = companyCollection.find(query);
      const companies = await cursor.toArray();
      for (const company of companies) {
        const filter = {
          companyId: company._id.toString(),
        };
        const jobCount = await jobCollection.countDocuments(filter);
        company.appliedCount = jobCount;
      }
      // console.log(companies);
      res.send(companies);
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

    // update user plan
    app.patch(
      "/api/companies/:id",
      logger,
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const updatedCompany = req.body;
        const updateDoc = {
          $set: {
            status: updatedCompany.status,
          },
        };
        const result = await companyCollection.updateOne(query, updateDoc);
        res.send(result);
      },
    );

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
