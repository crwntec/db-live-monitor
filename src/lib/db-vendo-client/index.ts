import {createClient} from 'db-vendo-client';
import {profile} from 'db-vendo-client/p/dbnav/index';

export const createVendoClient = () => createClient(profile, "db-live");