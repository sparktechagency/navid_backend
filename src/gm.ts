import fs from "fs";
import path from "path";

function createModule(profileName: string, moduleName: string): void {
  const baseDir = path.join(__dirname, profileName);
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir);
  }

  const moduleDir = path.join(baseDir, moduleName);
  if (!fs.existsSync(moduleDir)) {
    fs.mkdirSync(moduleDir);
  }

  const files: string[] = [
    `${moduleName}_types.ts`,
    `${moduleName}_controller.ts`,
    `${moduleName}_service.ts`,
    `${moduleName}_route.ts`,
    `${moduleName}_model.ts`,
    `${moduleName}_validate.ts`,
  ];

  const defaultContents: Record<string, string> = {
    [`${moduleName}_types.ts`]: `
    
    import { Document, Types } from "mongoose";
    
    export interface I${capitalize(moduleName)} extends Document {
        name: string;
        img: string;
    }
        
    `,

    [`${moduleName}_controller.ts`]: `
import { SearchKeys } from './../../utils/Queries';
import { Request, Response } from "express";
import { ${moduleName}_service } from "./${moduleName}_service";
import { sendResponse } from "../../utils/sendResponse";
import { HttpStatus } from "../../DefaultConfig/config";
import { IAuth } from '../Auth/auth_types';

const create = async(req: Request, res: Response)=> {
    const img = !Array.isArray(req.files) && req.files?.img && req.files.img.length > 0 && req.files.img[0]?.path || null;

    if (img) req.body.img = img

    const result = await ${moduleName}_service.create(req?.body)
    sendResponse(
        res,
        HttpStatus.CREATED,
        result
    )
}

const get_all=async(req: Request, res: Response)=> {

    const { search, ...otherValues } = req?.query;
    const searchKeys: SearchKeys = {}

    if (search) searchKeys.name = search as string

    const queryKeys = {
        ...otherValues
    }

    const result = await ${moduleName}_service.get_all(queryKeys, searchKeys)
    sendResponse(
        res,
        HttpStatus.SUCCESS,
        result
    )
}


const update =async(req: Request, res: Response)=> {
    const img = !Array.isArray(req.files) && req.files?.img && req.files.img.length > 0 && req.files.img[0]?.path || null;

    if (img) req.body.img = img

    const result = await ${moduleName}_service.update(req?.params?.id, req?.body)
    sendResponse(
        res,
        HttpStatus.SUCCESS,
        result
    )
}

const delete_${moduleName} = async(req: Request, res: Response)=> {

    const result = await ${moduleName}_service.delete_${moduleName}(req?.params?.id, req?.body, req?.user as IAuth)
    sendResponse(
        res,
        HttpStatus.SUCCESS,
        result
    )
}

export const ${moduleName}_controller = {
    create,
    get_all,
    update,
    delete_${moduleName}
}
 `,

    [`${moduleName}_service.ts`]: `

import mongoose, { model } from 'mongoose';
import Queries, { QueryKeys, SearchKeys } from "../../utils/Queries";
import { ${moduleName}_model } from "./${moduleName}_model";
import { service_model } from '../Service/service_model';
import { IAuth } from '../Auth/auth_types';
import bcrypt from 'bcrypt'
import Aggregator from '../../utils/Aggregator';

const create =async(data: { [key: string]: string })=> {
    const result = await ${moduleName}_model.create(data)
    return {
        success: true,
        message: '${moduleName} created successfully',
        data: result
    }
}

const get_all = async(queryKeys: QueryKeys, searchKeys: SearchKeys)=> {
    return await Aggregator(${moduleName}_model, queryKeys, searchKeys, [])
}

const update=async(id: string, data: { [key: string]: string }) =>{
    const result = await ${moduleName}_model.findByIdAndUpdate(id, {
        $set: {
            ...data
        }
    }, { new: true })

    return {
        success: true,
        message: '${moduleName} updated successfully',
        data: result
    }
}

const delete_${moduleName}=async(id: string, data: { [key: string]: string }, auth: IAuth)=> {

    const is_exists = await ${moduleName}_model.findOne({ _id: id, name: data?.name })

    if (!is_exists) throw new Error("${moduleName} not found")

    const is_pass_mass = await bcrypt.compare(data?.password, auth?.password)

    if (!is_pass_mass) throw new Error("password doesn't match")

const session = await mongoose.startSession();
try {
  const result = await session.withTransaction(async () => {
    const [result] = await Promise.all([
      ${moduleName}_model.findByIdAndDelete(id, { session }),
      service_model.deleteMany({ ${moduleName}: id }, { session }),
            ])
  return result
})
return {
  success: true,
  message: '${moduleName} deleted successfully',
  data: result
}
    } catch (error) {
  throw error;
} finally {
  await session.endSession();
}
}

export const ${moduleName}_service = Object.freeze({
  create,
  get_all,
  update,
  delete_${moduleName}
})  
    `,

    [`${moduleName}_route.ts`]: `
import express from 'express'
import asyncWrapper from '../../middleware/asyncWrapper';
import { ${moduleName}_controller } from './${moduleName}_controller';
import verifyToken from '../../middleware/verifyToken';
import config from '../../DefaultConfig/config';
import uploadFile from '../../middleware/fileUploader';

export const ${moduleName}_router = express.Router()

${moduleName}_router
    .post('/${moduleName}/create', verifyToken(config.ADMIN), uploadFile(), asyncWrapper(${moduleName}_controller.create))

    .get('/${moduleName}/get-all', asyncWrapper(${moduleName}_controller.get_all))

    .patch('/${moduleName}/update/:id', verifyToken(config.ADMIN), uploadFile(), asyncWrapper(${moduleName}_controller.update))

    .delete('/${moduleName}/delete/:id', verifyToken(config.ADMIN), asyncWrapper(${moduleName}_controller.delete_${moduleName}))
    
    `,

    [`${moduleName}_model.ts`]: `
    
import { model, Schema } from "mongoose";
import { I${capitalize(moduleName)} } from "./${moduleName}_types";

const ${moduleName}_schema = new Schema<I${capitalize(moduleName)}>({
    name: {
        type: String,
        required: [true, 'name is required'],
        unique: true
    },
    img: {
        type: String,
        required: [true, 'img is required']
    },

}, { timestamps: true });

export const ${moduleName}_model = model<I${capitalize(moduleName)}>("${moduleName}", ${moduleName}_schema);

    
    `,
    [`${moduleName}_validate.ts`]: `import { z } from "zod";
    
    const create_validation = z.object({
        body: z.object({
            email: z.string({
                required_error: "email is required z",
            }),
            password: z.string({ required_error: 'Password is required' }),
        })
    })
    export const ${moduleName}_validate = Object.freeze({
        create_validation
    })`,
  };

  files.forEach((file) => {
    const filePath = path.join(moduleDir, file);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, defaultContents[file], "utf8");
    }
  });

  console.log(
    `Module '${moduleName}' created successfully inside '${profileName}'.`,
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Run script with arguments
const args: string[] = process.argv.slice(2);

if (args.length !== 2) {
  console.log("Usage: ts-node script.ts <profileName> <moduleName>");
  process.exit(1);
}

const profileName: string = args[0];
const moduleName: string = args[1];
createModule(profileName, moduleName);
