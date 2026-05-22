const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");

const uri = process.env.MONGODB_URI;

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
);

const verifyToken = async (req, res, next) => {
  const authHeader = req?.headers?.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    // console.log("payloaaaaaaad", payload);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Forbidden" });
  }
};

async function run() {
  try {
    // await client.connect();

    const db = client.db("doc-appointment");

    const allDoctorsCollection = db.collection("all-doctors");
    const appointmentsCollection = db.collection("appointments");
    const usersCollection = db.collection("user");

    app.get("/all-doctors", async (req, res) => {
      const doctors = await allDoctorsCollection.find().toArray();
      res.json(doctors);
    });

    app.get("/all-doctors/:id", verifyToken, async (req, res) => {
      const docId = req.params.id;
      const query = { _id: new ObjectId(docId) };
      const doctor = await allDoctorsCollection.findOne(query);

      res.json(doctor);
    });

    app.post("/appointments", verifyToken, async (req, res) => {
      const appointment = req.body;
      const result = await appointmentsCollection.insertOne(appointment);

      res.json(result);
    });

    app.get("/appointments/:userId", verifyToken, async (req, res) => {
      const { userId } = req.params;
      const query = { userId: userId };

      const appointments = await appointmentsCollection.find(query).toArray();

      res.json(appointments);
    });

    app.patch("/appointments/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;
      const filter = { _id: new ObjectId(id) };
      const result = await appointmentsCollection.updateOne(filter, {
        $set: updatedData,
      });

      res.json(result);
    });

    app.delete("/appointments/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await appointmentsCollection.deleteOne(query);

      res.json(result);
    });

    // app.patch("/users/:id", async (req, res) => {
    //   const { id } = req.params;
    //   const updatedData = req.body;
    //   const filter = { _id: new ObjectId(id) };

    //   const result = await usersCollection.updateOne(filter, {
    //     $set: updatedData,
    //   });

    //   res.json(result);
    // });

    app.patch("/users/:id", verifyToken, async (req, res) => {
      try {
        const { id } = req.params;
        const updatedData = req.body;

        const filter = { _id: new ObjectId(id) };

        const result = await usersCollection.updateOne(filter, {
          $set: updatedData,
        });

        if (result.matchedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "User not found in this collection.",
          });
        }

        return res.json({ success: true, result });
      } catch (error) {
        console.error(error);
        return res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });

    // ===============================================

    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running well");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
