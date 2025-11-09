
import express from 'express'
import asyncWrapper from '../../middleware/asyncWrapper';
import { variants_controller } from './variants_controller';
import verifyToken from '../../middleware/verifyToken';
import config from '../../DefaultConfig/config';
import uploadFile from '../../middleware/fileUploader';

export const variants_router = express.Router()

variants_router
    .post('/variants/create', verifyToken(config.ADMIN), uploadFile(), asyncWrapper(variants_controller.create))

    .get('/variants/get-all', verifyToken(config.ADMIN), asyncWrapper(variants_controller.get_all))

    .patch('/variants/update/:id', verifyToken(config.ADMIN), uploadFile(), asyncWrapper(variants_controller.update))

    .delete('/variants/delete/:id', verifyToken(config.ADMIN), asyncWrapper(variants_controller.delete_variants))
    
    