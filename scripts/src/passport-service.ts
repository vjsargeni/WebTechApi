import mongodb from "mongodb";
import passport from "passport";
import {ExtractJwt, Strategy as JwtStrategy} from "passport-jwt";
import {Config} from "./config";
import {IUser} from "./user";

const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: Config.secret
};

// Setting up JWT login strategy
const JWTLogin = new JwtStrategy(jwtOptions, function(payload, done) {
    mongodb.connect(Config.database, function(err, db) {
        if (err) { throw err; }
        const Users = db.db("trainsDB").collection("users");
        Users.findOne({ email: payload.email }, function(err, user) {
            if (err) {
                db.close();
                return done(err, false);
            }

            if (user) {
                done(null, user);
            } else {
                done(null, false);
            }
            db.close();
        });
    });

});

passport.use(JWTLogin);

// tslint:disable-next-line: no-namespace
export namespace PassportService {
    export const requireAuth = passport.authenticate("jwt", { session: false });
}
