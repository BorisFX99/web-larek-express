import { Request, Response, NextFunction } from 'express';
import * as Errors from '../errors';

const notFound = (_req:Request, _res:Response, next:NextFunction) => next(new Errors.NotFoundError('Страница не найдена'));

export default notFound;
