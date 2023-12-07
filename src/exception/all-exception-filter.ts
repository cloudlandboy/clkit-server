/**
 * $1
 * @author: clboy
 * @date: 2023-12-05 10:53:53
 * @Copyright (c) 2023 by syl@clboy.cn, All Rights Reserved. 
 */
import { Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {

    catch(exception: unknown, host: ArgumentsHost): void {
        console.error(exception);
        let message = "服务器出错啦";
        if ((typeof exception) === 'string') {
            message = exception + '';
        } else if (exception instanceof Error) {
            message = exception.message;
        }

        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const httpStatus: number = exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;
        response.status(httpStatus).json({
            statusCode: httpStatus,
            message: message,
            path: request.url,
        });
    }
}