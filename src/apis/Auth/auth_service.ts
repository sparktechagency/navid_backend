import jwt from "jsonwebtoken";
import { verification_service } from "../Verification/verification_service";
import auth_model, { calculateAge } from "./auth_model";
import { IAuth } from "./auth_types";
import bcrypt from "bcrypt";
import config from "../../DefaultConfig/config";
import hashText from "../../utils/hashText";
import { UnlinkFiles } from "../../middleware/fileUploader";
import Aggregator, { QueryKeys, SearchKeys } from "../../utils/Aggregator";

async function sign_up(data: { [key: string]: string }, auth?: IAuth) {
  const {
    role,
    is_verified,
    block,
    credits,
    is_identity_verified,
    accessToken,
    confirm_password,
    ...otherValues
  } = data;

  if (confirm_password != otherValues?.password)
    throw new Error(`confirm password doesn't match `);

  const user = await auth_model
    .findOne({ email: otherValues.email, is_verified: false })
    .lean();

  if (user) return await verification_service.create(user.email as string);

  await auth_model.create({
    ...otherValues,
    ...((auth?.role == "ADMIN" || auth?.role == "SUPER_ADMIN") && { role }),
  });

  return await verification_service.create(otherValues?.email as string);
}

async function sing_in(data: { [key: string]: string }) {
  const user = await auth_model.findOne({ email: data?.email });

  if (!user) throw new Error(`invalid credentials`);

  if (!user?.is_verified) throw new Error(`please verify your email`);

  const is_match_pass = await bcrypt.compare(data?.password, user?.password);

  if (!is_match_pass) throw new Error(`invalid credentials`);

  const token = await jwt.sign(
    { email: user?.email, id: user?._id, role: user?.role },
    config.ACCESS_TOKEN_SECRET || "",
    { expiresIn: 60 * 60 * 24 * 500 },
  );

  return {
    success: true,
    message: `login successfully`,
    email: user?.email,
    token,
  };
}

async function reset_password(data: { [key: string]: string }, auth: IAuth) {
  let { password, confirm_password } = data;

  if (password !== confirm_password)
    throw new Error(`confirm password doesn't match `);

  password = await hashText(password);

  const result = await auth_model.updateOne(
    { _id: auth?._id },
    {
      $set: {
        password,
        accessToken: "",
      },
    },
  );

  if (result.modifiedCount == 1) {
    const token = await jwt.sign(
      { email: auth?.email, id: auth?._id, role: auth?.role },
      config.ACCESS_TOKEN_SECRET || "",
      { expiresIn: 60 * 60 * 24 * 500 },
    );

    return {
      success: true,
      message: `password reset successfully`,
      data: {
        email: auth?.email,
        _id: auth?._id,
        role: auth?.role,
        name: auth?.name,
      },
      token: token,
    };
  } else {
    throw new Error(`unable to reset password`);
  }
}

async function change_password(data: { [key: string]: string }, auth: IAuth) {
  let { old_password } = data;

  const is_match_pass = await bcrypt.compare(old_password, auth?.password);

  if (!is_match_pass) throw new Error(`old password doesn't match `);

  return await reset_password(data, auth);
}

async function update_auth(
  data: {
    [key: string]: string | { [key: string]: string | boolean } | boolean;
  },
  auth: IAuth,
) {
  const result = await auth_model.updateOne(
    { _id: auth?._id },
    {
      $set: {
        ...data,
      },
    },
  );

  if (data?.img && auth?.img) UnlinkFiles([auth?.img]);

  return {
    success: true,
    message: "profile updated successfully",
    data: result,
  };
}

async function get_profile(auth: IAuth) {
  const { password, ...otherDetails } = auth;
  const age = calculateAge(otherDetails?.date_of_birth?.toString());
  return {
    success: true,
    message: "profile fetched successfully",
    data: { ...otherDetails, age },
  };
}

async function verify_identity(id: string) {
  const result = await auth_model.updateOne(
    { _id: id },
    {
      $set: {
        is_identity_verified: true,
      },
    },
  );
  if (result.modifiedCount == 1) {
    return {
      success: true,
      message: "identity verified successfully",
    };
  } else {
    throw new Error(`unable to verify identity`);
  }
}

async function block_auth(id: string) {
  const result = await auth_model.findOneAndUpdate(
    { _id: id },
    [
      {
        $set: {
          block: {
            $cond: {
              if: { $eq: ["$block", false] },
              then: true,
              else: false,
            },
          },
        },
      },
    ],
    { new: true },
  );
  return {
    success: true,
    message: `user ${result?.block ? "unblocked" : "blocked"} successfully`,
  };
}

async function get_all(QueryKeys: QueryKeys, SearchKey: SearchKeys) {
  return Aggregator(auth_model, QueryKeys, SearchKey, [
    {
      $addFields: {
        age: {
          $dateDiff: {
            startDate: "$date_of_birth",
            endDate: new Date(),
            unit: "year",
          },
        },
      },
    },
  ]);
}

export const auth_service = Object.freeze({
  sign_up,
  sing_in,
  change_password,
  update_auth,
  get_profile,
  verify_identity,
  block_auth,
  reset_password,
  get_all,
});
