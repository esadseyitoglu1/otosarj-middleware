/**
 * GET /api/v1/stations/:id/live
 *
 * GUVENLIK KARARI (plan G3): bu ucnokta PUBLIC DEGIL. Saha doluluk verisi
 * ticari sirdir -- rakip operator buradan yogunluk/ciro tahmini cikarabilir.
 * Sadece yetkili operator kendi sahasini gorebilir (requireSignedRequest +
 * operatorId eslesmesi).
 */
import type { Request, Response } from 'express';
import type { CsmsAdapter } from '../adapters/csms/CsmsAdapter.js';

export function createStationLiveHandler(csms: CsmsAdapter) {
  return async function stationLiveHandler(req: Request, res: Response): Promise<void> {
    const stationId = req.params.id;
    if (typeof stationId !== 'string') {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }

    const station = await csms.getStation(stationId);
    if (!station) {
      res.status(404).json({ error: 'not_found' });
      return;
    }

    if (station.operatorId !== req.operatorId) {
      // Jenerik 404 -- baska operatorun sahasinin VAR OLDUGUNU bile sizdirmiyoruz.
      res.status(404).json({ error: 'not_found' });
      return;
    }

    res.status(200).json(station);
  };
}
