import cors from 'cors';

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',')||[];

const corsOptions = {
    origin: (origin, callback) => {
        if(!origin || allowedOrigins.includes(origin)){
            callback(null, true);
        }else{
            callback(new Error('CORS 정책에 의해 차단된 요청입니다.'));
        }
    }
}

export default cors(corsOptions);