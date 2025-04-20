import * as Ably from 'ably';
import { ABLY_API_KEY } from './constants';

const ablyClient = new Ably.Realtime({
    address: 'chatiwal-chat',
    key: ABLY_API_KEY
}); 

export default ablyClient;