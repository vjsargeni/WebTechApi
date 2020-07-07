import bcrypt from "bcryptjs";
import crypto from "crypto";
import express from "express";
import {STATUS_CODES} from "http";
import jwt from "jsonwebtoken";
import mongodb from "mongodb";
import {Config} from "./config";
import {IUser} from "./user";

const EXPIRES_IN_SECONDS = 10000;

function generateToken(userInfo: any) {
    return jwt.sign(userInfo, Config.secret, {
        expiresIn: EXPIRES_IN_SECONDS // Seconds
    });
}

function comparePassword(userPassword: string, candidatePassword: string, cb: (err: Error, isMatch?: boolean) => void) {
    if (userPassword === "*") {
        cb(null, false);
        return;
    }
    bcrypt.compare(candidatePassword, userPassword, function(err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
}

function hashPassword(password: string, cb: (err: Error, hashedPassword?: string) => any) {
    const SALT_FACTOR = 5;

    bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
        if (err) { return err; }

        bcrypt.hash(password, salt, function(err, hash) {
            if (err) { return err; }
            cb(null, hash);
        });
    });
}

function extractUserInfo(user: any) {
    return {
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname
    };
}

export class AuthenticationController {

    public register(req: express.Request, res: express.Response, next: express.NextFunction) {
        const email = req.body.email;
        const lastname = req.body.lastname;
        const firstname = req.body.firstname;
        const password = req.body.password;
        const trips: any[] = [];

        if (!email) {
            return res.status(422).send({ error: "You must enter an email address." });
        }
        if (!(firstname && lastname)) {
             return res.status(422).send({ error: "You must enter your full name." });
        }
        if (!password) {
            return res.status(422).send({ error: "You must enter a password." });
        }

        mongodb.connect(Config.database, function(err, db) {
            if (err) {throw err; }
            const Users = db.db("trainsDB").collection("users");
            Users.findOne({ email: req.body.email }, function(err, existingUser) {
                if (err) {
                    db.close();
                    return next(err);
                }
                if (existingUser) {
                    db.close();
                    return res.status(422).send({ error: "That email address is already in use." });
                } else {
                    hashPassword(password, function(err, hashedPassword) {
                        if (err) { throw err; }
                        const user = {
                            email,
                            password: hashedPassword,
                            firstname,
                            lastname,
                            trips
                        };
                        Users.insertOne(user, function(err, dbres) {
                            if (err) { throw err; }
                            const userInfo = extractUserInfo(dbres.ops[0]);
                            res.status(201).json({
                                token: "Bearer " + generateToken(userInfo),
                                user: userInfo,
                                expiresIn: EXPIRES_IN_SECONDS
                            });
                            db.close();
                        });
                    });
                }
            });
        });
    }

    public login(req: express.Request, res: express.Response, next: express.NextFunction) {
        mongodb.connect(Config.database, function(err, db) {
            if (err) { throw err; }
            const Users = db.db("trainsDB").collection("users");
            Users.findOne({ email: req.body.email }, function(err, user) {
                if (err) {
                    db.close();
                    return res.status(400).json({ error: "bad data" });
                }
                if (!user) {
                    db.close();
                    return res.status(400).json({
                        error: "Your login details could not be verified. Please try again."
                    });
                }
                comparePassword(user.password, req.body.password, function(err, isMatch) {
                    if (err) { return res.status(400).json({ error: "bad data" }); }
                    if (!isMatch) { return res.status(400).json({ error: "Your login details could not be verified. Please try again." }); }

                    const userInfo = extractUserInfo(user);
                    res.status(200).json({
                        token: "Bearer " + generateToken(userInfo),
                        user: userInfo,
                        expiresIn: EXPIRES_IN_SECONDS
                    });
                });
                db.close();
            });
        });
    }

    public refresh(req: express.Request, res: express.Response, next: express.NextFunction) {
        const userInfo = extractUserInfo(req.user);
        res.status(200).json({
            token: "Bearer " + generateToken(userInfo),
            user: userInfo,
            expiresIn: EXPIRES_IN_SECONDS
        });
    }

    public authorize(req: express.Request, res: express.Response, next: express.NextFunction) {
        return res.status(200).json({
            validated: true
        });
    }

    public updatePassword(req: express.Request, res: express.Response) {
        mongodb.connect(Config.database, function(err, db) {
            if (err) { throw err; }

            // Validate current password
            const Users = db.db("trainsDB").collection("users");
            Users.findOne({ email: req.user.email }, function(err, user) {
                if (err) {
                    db.close();
                    return res.status(400).json({ error: "bad data" });
                }
                if (!user) {
                    db.close();
                    return res.status(400).json({
                        error: "Your login details could not be verified. Please try again."
                    });
                }
                comparePassword(user.password, req.body.oldPassword, function(err, isMatch) {
                    if (err) { return res.status(400).json({ error: "bad data" }); }
                    if (!isMatch) { return res.status(400).json({ error: "Your login details could not be verified. Please try again." }); }
                    // Now we know that old password is valid
                    hashPassword(req.body.password, function(err, hashedPassword) {
                        if (err) { throw err; }
                        // @ts-ignore
                        const myquery = { email: req.user.email };
                        const newvalues = {
                            $set: {
                               password: hashedPassword
                            }
                        };
                        Users.updateOne(myquery, newvalues, function(err, _) {
                            if (err) { throw err; }
                            db.close();
                            res.status(200).send();
                        });
                    });
                });
            });
        });
    }

}
