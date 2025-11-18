import { Request, Response } from 'express';
import mongoose from 'mongoose';
import PartnerRecord from '../models/PartnerRecord';
import AdminSettings from '../models/AdminSettings';
import Transaction from '../models/Transaction';
import User from '../models/User';
import { sendPartnerFee } from '../services/walletService';

/**
 * @desc    Get all partner records
 * @route   GET /api/admin/partner-records
 * @access  Private/Admin
 */
export const getPartnerRecords = async (req: Request, res: Response) => {
  try {
    // Get all partner records
    const partnerRecords = await PartnerRecord.find().sort({ partnerName: 1 });

    res.status(200).json({
      success: true,
      partnerRecords
    });
  } catch (error) {
    console.error('Error getting partner records:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Payout all pending partner fees
 * @route   POST /api/admin/partner-records/payout
 * @access  Private/Admin
 */
export const payoutPartnerFees = async (req: Request, res: Response) => {
  try {
    const user = req.user as { _id: mongoose.Types.ObjectId };

    // Get all partner records with pending fees
    const partnerRecords = await PartnerRecord.find({ pendingFees: { $gt: 0 } });

    if (partnerRecords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No pending fees to payout'
      });
    }

    // Process each partner record
    const results = [];
    for (const record of partnerRecords) {
      try {
        // Only process if there are pending fees
        if (record.pendingFees <= 0) continue;

        console.log(`Processing payout for partner ${record.partnerName} (${record.walletAddress}): ${record.pendingFees} SOL`);

        // Send the fee from admin wallet to partner wallet
        const txSignature = await sendPartnerFee(
          record.walletAddress,
          record.pendingFees,
          'admin-payout'
        );

        // Update all pending transactions to paid
        const now = new Date();
        for (const tx of record.transactions) {
          if (tx.status === 'pending') {
            tx.status = 'paid';
            tx.paidAt = now;
            tx.txHash = txSignature;
          }
        }

        // Update partner record
        record.paidFees += record.pendingFees;
        record.pendingFees = 0;
        record.lastPayout = now;
        await record.save();

        // Create a transaction record for the payout
        await Transaction.create({
          user: user._id,
          type: 'fee',
          amount: record.pendingFees,
          tokenType: 'SOL',
          description: `Partner fee payout to ${record.partnerName || record.walletAddress}`,
          status: 'completed',
          txHash: txSignature,
          toWallet: record.walletAddress
        });

        results.push({
          partnerId: record._id,
          partnerName: record.partnerName,
          walletAddress: record.walletAddress,
          amount: record.pendingFees,
          txSignature
        });
      } catch (error) {
        console.error(`Error processing payout for partner ${record._id}:`, error);
        results.push({
          partnerId: record._id,
          partnerName: record.partnerName,
          walletAddress: record.walletAddress,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Partner fees payout processed',
      results
    });
  } catch (error) {
    console.error('Error processing partner fees payout:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Update partner fee distribution function
 * @note    This function should be called when a fee transaction is created
 */
export const updatePartnerRecord = async (
  partnerId: string,
  partnerName: string,
  walletAddress: string,
  amount: number,
  predictionId?: mongoose.Types.ObjectId,
  predictionTitle?: string
) => {
  try {
    // Find or create partner record
    let partnerRecord = await PartnerRecord.findOne({ partnerId });

    if (!partnerRecord) {
      partnerRecord = new PartnerRecord({
        partnerId,
        partnerName: partnerName || 'Unnamed Partner',
        walletAddress,
        totalFees: 0,
        pendingFees: 0,
        paidFees: 0,
        transactions: []
      });
    }

    // Add transaction to partner record
    partnerRecord.transactions.push({
      amount,
      createdAt: new Date(),
      predictionId,
      predictionTitle,
      status: 'pending'
    });

    // Update totals
    partnerRecord.totalFees += amount;
    partnerRecord.pendingFees += amount;

    // Save partner record
    await partnerRecord.save();

    return partnerRecord;
  } catch (error) {
    console.error('Error updating partner record:', error);
    throw error;
  }
};
