import * as Nedb from "nedb";
import { serverHomeFile } from "./file-utils";

export class NedbHelper<E> {

    private datastore: Nedb.Datastore;

    constructor(name: string) {
        this.datastore = new Nedb({
            filename: serverHomeFile(`${name}.db`),
            timestampData: true,
            autoload: true,
        })
    }

    create(dto: any): Promise<E> {
        delete dto._id;
        return new Promise((res, rej) => {
            this.datastore.insert(dto, (err, entity) => {
                if (err) {
                    rej(err);
                } else {
                    res(entity);
                }
            });
        })
    }

    async findAll(): Promise<E[]> {
        return this.findByQuery({});
    }

    async findById(id: string): Promise<E> {
        const result = await this.findByQuery({ _id: id });
        return result[0];
    }

    findByQuery(query: any): Promise<E[]> {
        return new Promise((res, rej) => {
            this.datastore.find(query, function (err, docs) {
                if (err) {
                    rej(err);
                } else {
                    res(docs);
                }
            });
        })
    }

    update(id: string, dto: any): Promise<E> {
        return new Promise((res, rej) => {
            this.datastore.update({ _id: id }, dto, { returnUpdatedDocs: true }, (err, numAffected, affectedDocuments) => {
                if (err) {
                    rej(err);
                } else {
                    res(affectedDocuments);
                }
            });
        })
    }

    remove(id: string): Promise<boolean> {
        return new Promise((res, rej) => {
            this.datastore.remove({ _id: id }, {}, (err, numRemoved) => {
                if (err) {
                    rej(err);
                } else {
                    res(numRemoved === 1);
                }
            });
        })
    }
}