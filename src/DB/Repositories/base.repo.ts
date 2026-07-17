import {
  HydratedDocument,
  InsertManyOptions,
  Model,
  MongooseUpdateQueryOptions,
  PopulateOptions,
  ProjectionType,
  QueryFilter,
  QueryOptions,
  SaveOptions,
  UpdateQuery,
  UpdateWriteOpResult,
} from 'mongoose';

export abstract class DatabaseRepository<TDocument> {
  constructor(protected readonly model: Model<TDocument>) {}

  async findOne({
    filter,
    select,
    options,
  }: {
    filter?: QueryFilter<TDocument>;
    select?: ProjectionType<TDocument> | null;
    options?: QueryOptions<TDocument> | null;
  }) {
    const doc = this.model.findOne(filter).select(select || '');
    if (options?.populate) {
      doc.populate(options.populate as PopulateOptions[]);
    }
    return await doc.exec();
  }

  async findById({
    id,
    select,
    options,
  }: {
    id: string;
    select?: ProjectionType<TDocument> | null;
    options?: QueryOptions<TDocument> | null;
  }) {
    const doc = this.model.findById(id).select(select || '');
    if (options?.populate) {
      doc.populate(options.populate as PopulateOptions[]);
    }
    return await doc.exec();
  }

  async create({
    data,
    options,
  }: {
    data: Partial<TDocument>[] | Array<Partial<TDocument>>;
    options?: SaveOptions | undefined;
  }): Promise<HydratedDocument<TDocument>[] | undefined> {
    return await this.model.create(data as any, options);
  }

  async find({
    filter,
    select,
    options,
  }: {
    filter?: QueryFilter<TDocument>;
    select?: ProjectionType<TDocument> | null;
    options?: QueryOptions<TDocument> | null;
  }) {
    const doc = this.model.find(filter || {}).select(select || '');
    if (options?.populate) {
      doc.populate(options.populate as PopulateOptions[]);
    }

    if (options?.skip) doc.skip(options.skip);
    if (options?.limit) doc.limit(options.limit);

    return await doc.exec();
  }

  async insertMany({
    data,
    options,
  }: {
    data: Array<Partial<TDocument>>;
    options?: InsertManyOptions | undefined;
  }) {
    return await this.model.insertMany(data, options as any);
  }

  async updateOne({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TDocument>;
    update: UpdateQuery<TDocument>;
    options?: MongooseUpdateQueryOptions<TDocument> | null;
  }): Promise<UpdateWriteOpResult> {
    return await this.model.updateOne(
      filter,
      { ...update, $inc: { __v: 1 } },
      options,
    );
  }

  async findOneAndUpdate({
    filter,
    update,
    select,
    options = { new: true },
  }: {
    filter?: QueryFilter<TDocument>;
    update?: UpdateQuery<TDocument>;
    select?: ProjectionType<TDocument> | null;
    options?: QueryOptions<TDocument> | null;
  }) {
    if (Array.isArray(update)) {
      update.push({ $set: { __v: { $add: ['$__v', 1] } } });
      return await this.model
        .findOneAndUpdate(filter, update, { ...options })
        .select(select || '');
    }
    return await this.model
      .findOneAndUpdate(filter, update, { ...options, inc: { __v: 1 } })
      .select(select || '');
  }

  async findByIdAndUpdate({
    id,
    update,
    select,
    options,
  }: {
    id: string;
    update?: UpdateQuery<TDocument>;
    select?: ProjectionType<TDocument> | null;
    options?: QueryOptions<TDocument> | null;
  }) {
    const doc = this.model
      .findByIdAndUpdate(id, update, { new: true, ...options } as any)
      .select(select || '');
    if (options?.populate) {
      doc.populate(options.populate as PopulateOptions[]);
    }
    return await doc.exec();
  }

  async deleteOne({
    filter,
    options,
  }: {
    filter?: QueryFilter<TDocument>;
    options?: QueryOptions<TDocument> | null;
  }) {
    return await this.model.deleteOne(filter as any, options as any);
  }

  async deleteMany({
    filter,
    options,
  }: {
    filter?: QueryFilter<TDocument>;
    options?: QueryOptions<TDocument> | null;
  }) {
    return await this.model.deleteMany(filter as any, options as any);
  }

  async findOneAndDelete({
    filter,
    select,
    options,
  }: {
    filter?: QueryFilter<TDocument>;
    select?: ProjectionType<TDocument> | null;
    options?: QueryOptions<TDocument> | null;
  }) {
    const doc = this.model
      .findOneAndDelete(filter, options as any)
      .select(select || '');
    if (options?.populate) {
      doc.populate(options.populate as PopulateOptions[]);
    }
    return await doc.exec();
  }

  async findByIdAndDelete({
    id,
    select,
    options,
  }: {
    id: string;
    select?: ProjectionType<TDocument> | null;
    options?: QueryOptions<TDocument> | null;
  }) {
    const doc = this.model
      .findByIdAndDelete(id, options as any)
      .select(select || '');
    if (options?.populate) {
      doc.populate(options.populate as PopulateOptions[]);
    }
    return await doc.exec();
  }
}
