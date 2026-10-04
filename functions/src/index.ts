import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

/**
 * Cloud Function: onDepositApproved
 * Triggers when an Admin marks a deposit as APPROVED in Firestore.
 * Atomically credits the user wallet and updates transaction status.
 */
export const onDepositApproved = functions.firestore
  .document('deposits/{depositId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Trigger only on status transition from PENDING to APPROVED
    if (before.status !== 'APPROVED' && after.status === 'APPROVED') {
      const depositId = context.params.depositId;
      const userId = after.userId;
      const amount = after.amount;

      const walletRef = db.doc(`wallets/${userId}`);

      await db.runTransaction(async (t) => {
        const wSnap = await t.get(walletRef);
        let curBalance = 0;
        let curPending = 0;
        let curDeposited = 0;

        if (wSnap.exists) {
          const data = wSnap.data() || {};
          curBalance = data.balance || 0;
          curPending = data.pendingDeposits || 0;
          curDeposited = data.totalDeposited || 0;
        }

        t.set(walletRef, {
          balance: curBalance + amount,
          pendingDeposits: Math.max(0, curPending - amount),
          totalDeposited: curDeposited + amount,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Update matching transaction record
        const txQuery = await db.collection('transactions')
          .where('referenceId', '==', depositId)
          .limit(1)
          .get();

        if (!txQuery.empty) {
          t.update(txQuery.docs[0].ref, {
            status: 'COMPLETED',
            adminNote: `Server verified & credited by Cloud Function`,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      });
    }
  });

/**
 * Cloud Function: onWithdrawalRejected
 * Automatically refunds locked balance to user's wallet if an admin rejects the withdrawal.
 */
export const onWithdrawalRejected = functions.firestore
  .document('withdrawals/{withdrawalId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.status !== 'REJECTED' && after.status === 'REJECTED') {
      const userId = after.userId;
      const amount = after.amount;
      const walletRef = db.doc(`wallets/${userId}`);

      await db.runTransaction(async (t) => {
        const wSnap = await t.get(walletRef);
        if (wSnap.exists) {
          const data = wSnap.data() || {};
          const curBalance = data.balance || 0;
          const curPending = data.pendingWithdrawals || 0;

          t.update(walletRef, {
            balance: curBalance + amount,
            pendingWithdrawals: Math.max(0, curPending - amount),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      });
    }
  });

/**
 * Scheduled Cloud Function: dailyMidnightHarvestNotification
 * Runs daily at midnight PKT to notify active farmers that fresh eggs are ready for harvest.
 */
export const dailyMidnightHarvestNotification = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('Asia/Karachi')
  .onRun(async () => {
    const notifRef = db.collection('notifications').doc();
    await notifRef.set({
      id: notifRef.id,
      userId: 'ALL',
      title: 'Morning Egg Harvest Ready!',
      message: 'Your active hen flocks have finished laying for the cycle. Visit the harvest pasture to collect your digital eggs.',
      type: 'INFO',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  });
