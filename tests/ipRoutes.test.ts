import request from "supertest";
import app from "../src/app";
import jwt from "jsonwebtoken";
import fs from "fs";

let testIpStorageFile = "./testIpStorageFile.txt";
let validIpAddress: string;
let invalidIpAddreses: unknown[];

const generateTestToken = (iatOffsetSeconds: number = 0) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("Server configuration incomplete");
  }
  const payload = {};
  const iat = Math.floor(Date.now() / 1000) + iatOffsetSeconds;
  const token = jwt.sign({ ...payload, iat }, jwtSecret);
  return token;
};

const calculateRandomTestIpAddress = () => {
  return [
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
  ].join(".");
};

beforeAll(() => {
  process.env.IP_STORAGE_FILE = testIpStorageFile;
});

describe("POST /ip", () => {
  beforeAll(() => {
    validIpAddress = calculateRandomTestIpAddress();
    invalidIpAddreses = [
      null,
      "",
      undefined,
      "100000",
      validIpAddress.substring(0, validIpAddress.lastIndexOf(".")), // missing a number
      `${validIpAddress}.${Math.floor(Math.random() * 256)}`, // extra number
      "abc.def.g.h",
      true,
      {},
    ];
  });

  describe("Bad Token", () => {
    it("T10: should fail when no auth token is provided", async () => {
      const response = await request(app)
        .post("/ip")
        .send({ ipAddress: validIpAddress });

      expect(response.statusCode).toBe(401);
      expect(response.body).toMatchObject({});
    });

    it("T20: should fail when an invalid auth token is provided", async () => {
      const invalidToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      const response = await request(app)
        .post("/ip")
        .set("Authorization", `Bearer ${invalidToken}`)
        .send({ ipAddress: validIpAddress });

      expect(response.statusCode).toBe(401);
      expect(response.body).toMatchObject({});
    });

    it("T30: should fail when an expired auth token is provided", async () => {
      const expiredAuthToken = generateTestToken(-300); // 5 mins old
      const response = await request(app)
        .post("/ip")
        .set("Authorization", `Bearer ${expiredAuthToken}`)
        .send({ ipAddress: validIpAddress });

      expect(response.statusCode).toBe(401);
      expect(response.body).toMatchObject({});
    });
  });

  describe("Bad Request", () => {
    it("T10: should fail when no request body is provided", async () => {
      const validToken = generateTestToken();
      const response = await request(app)
        .post("/ip")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.statusCode).toBe(400);
      expect(response.text).toBe("No IP address provided");
      expect(response.body).toMatchObject({});
    });

    it("T20: should fail when request has no ip address parameter provided", async () => {
      const validToken = generateTestToken();
      const response = await request(app)
        .post("/ip")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ macAddress: "00-B0-D0-63-C2-26", subnetMask: "255.255.255.0" });

      expect(response.statusCode).toBe(400);
      expect(response.text).toBe("No IP address provided");
      expect(response.body).toMatchObject({});
    });

    it("T30: should fail when requests provide invalid ip addresses", async () => {
      const validToken = generateTestToken();
      for (const invalidIpAddress of invalidIpAddreses) {
        const response = await request(app)
          .post("/ip")
          .set("Authorization", `Bearer ${validToken}`)
          .send({
            ipAddress: invalidIpAddress,
          });

        expect(response.statusCode).toBe(400);
        if (!invalidIpAddress) {
          expect(response.text).toBe("No IP address provided");
        } else {
          expect(response.text).toBe("Invalid IP address");
        }
        expect(response.body).toMatchObject({});
      }
    });
  });

  describe("Good request", () => {
    it("T10: should succeed when a valid ip address and auth token are provided", async () => {
      const validToken = generateTestToken();
      const response = await request(app)
        .post("/ip")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ ipAddress: validIpAddress });

      expect(response.statusCode).toBe(200);
      expect(response.text).toBe("IP address updated successfully");
      expect(response.body).toMatchObject({});

      if (!testIpStorageFile) {
        throw new Error("Test configuration incomplete");
      }

      expect(fs.existsSync(testIpStorageFile)).toBeTruthy();
      const storedIp = fs.readFileSync(testIpStorageFile, "utf8");
      expect(storedIp).toBe(validIpAddress);
    });
  });
});

describe("GET /ip", () => {
  const testValidIpAddress = calculateRandomTestIpAddress();
  beforeAll(() => {
    fs.writeFileSync(testIpStorageFile, testValidIpAddress);
  });

  describe("Bad Token", () => {
    it("T10: should fail when no auth token is provided", async () => {
      const response = await request(app).get("/ip");

      expect(response.statusCode).toBe(401);
      expect(response.body).toMatchObject({});
    });

    it("T20: should fail when an invalid auth token is provided", async () => {
      const invalidToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      const response = await request(app)
        .get("/ip")
        .set("Authorization", `Bearer ${invalidToken}`);

      expect(response.statusCode).toBe(401);
      expect(response.body).toMatchObject({});
    });

    it("T30: should fail when an expired auth token is provided", async () => {
      const expiredAuthToken = generateTestToken(-300); // 5 mins old
      const response = await request(app)
        .get("/ip")
        .set("Authorization", `Bearer ${expiredAuthToken}`);

      expect(response.statusCode).toBe(401);
      expect(response.body).toMatchObject({});
    });
  });

  describe("Good request", () => {
    it("T10: should succeed when a valid ip address and auth token are provided", async () => {
      const validToken = generateTestToken();
      const response = await request(app)
        .get("/ip")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.statusCode).toBe(200);
      console.log({
        text: response.text,
        testValidIpAddress,
        envVar: process.env.IP_STORAGE_FILE,
      });

      expect(response.text).toBe(testValidIpAddress);

      if (!testIpStorageFile) {
        throw new Error("Test configuration incomplete");
      }

      expect(fs.existsSync(testIpStorageFile)).toBeTruthy();
      const storedIp = fs.readFileSync(testIpStorageFile, "utf8");

      expect(storedIp).toBe(testValidIpAddress);
    });
  });
});

afterAll((done) => {
  delete process.env.IP_STORAGE_FILE;
  fs.unlink(testIpStorageFile, (err) => {
    if (err) throw err;
    done();
  });
});
