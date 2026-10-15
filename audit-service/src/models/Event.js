const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    quoteRequestId: { type: Number, required: true },
    actorId: { type: Number, default: null },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    occurredAt: { type: Date, required: true },
  },
  {
    timestamps: { createdAt: 'receivedAt', updatedAt: false },
    versionKey: false,
    minimize: false,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  },
);

eventSchema.index({ quoteRequestId: 1, occurredAt: -1 });
eventSchema.index({ type: 1, occurredAt: -1 });
eventSchema.index({ occurredAt: -1 });

module.exports = mongoose.model('Event', eventSchema);
