import mongoose, { Schema } from 'mongoose';

export interface IHolder {
  address: string;
}

const HolderSchema: Schema = new Schema({
  address: { type: String, required: true, unique: true },
});

export default mongoose.model<IHolder>('BrainsHolder', HolderSchema);
