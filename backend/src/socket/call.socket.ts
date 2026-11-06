import { Server } from "socket.io";

import { privateUsers } from "../config/users";

import { AuthenticatedSocket } from "./socketAuth";

// ==========================================
// TYPES
// ==========================================

interface CallOfferData {
  offer: RTCSessionDescriptionInit;
  callType: "audio" | "video";
}

interface CallAnswerData {
  answer: RTCSessionDescriptionInit;
  targetUserId: string;
}

interface IceCandidateData {
  candidate: RTCIceCandidateInit;
  targetUserId: string;
}

interface CallUserData {
  targetUserId: string;
}

// ==========================================
// REGISTER CALL SOCKET
// ==========================================

export function registerCallSocket(
  io: Server,
  socket: AuthenticatedSocket
) {
  if (!socket.user) {
    return;
  }

  const currentUser =
    socket.user;

  // ========================================
  // CALL USER
  // ========================================

socket.on(
  "call-user",
  (data: CallOfferData) => {
    if (!data?.offer) {
      return;
    }

    const receiver =
      privateUsers.find(
        (user) =>
          user.id !== currentUser.id
      );

    if (!receiver) {
      return;
    }

    const callType:
      | "audio"
      | "video" =
      data.callType === "video"
        ? "video"
        : "audio";

    console.log(
      `${currentUser.name} calling ${receiver.name} (${callType})`
    );

    // Send incoming call to receiver
    io.to(receiver.id).emit(
      "incoming-call",
      {
        callerId: currentUser.id,
        callerName: currentUser.name,
        callType,
        offer: data.offer,
      }
    );

    // Tell caller that receiver is ringing
    socket.emit(
      "call-ringing",
      {
        targetUserId: receiver.id,
      }
    );
  }
);
  // ========================================
  // ANSWER CALL
  // ========================================

  socket.on(
    "answer-call",
    (
      data: CallAnswerData
    ) => {
      if (
        !data?.answer ||
        !data?.targetUserId
      ) {
        return;
      }

      console.log(
        `${currentUser.name} answered call from ${data.targetUserId}`
      );

      io.to(
        data.targetUserId
      ).emit(
        "call-answered",
        {
          answer:
            data.answer,

          answeredBy:
            currentUser.id,
        }
      );
    }
  );

  // ========================================
  // ICE CANDIDATE
  // ========================================

  socket.on(
    "ice-candidate",
    (
      data: IceCandidateData
    ) => {
      if (
        !data?.candidate ||
        !data?.targetUserId
      ) {
        return;
      }

      io.to(
        data.targetUserId
      ).emit(
        "ice-candidate",
        {
          candidate:
            data.candidate,

          fromUserId:
            currentUser.id,
        }
      );
    }
  );

  // ========================================
  // REJECT CALL
  // ========================================

  socket.on(
    "reject-call",
    (
      data: CallUserData
    ) => {
      if (
        !data?.targetUserId
      ) {
        return;
      }

      console.log(
        `${currentUser.name} rejected call`
      );

      io.to(
        data.targetUserId
      ).emit(
        "call-rejected",
        {
          rejectedBy:
            currentUser.id,
        }
      );
    }
  );

  // ========================================
  // END CALL
  // ========================================

  socket.on(
    "end-call",
    (
      data: CallUserData
    ) => {
      if (
        !data?.targetUserId
      ) {
        return;
      }

      console.log(
        `${currentUser.name} ended call`
      );

      io.to(
        data.targetUserId
      ).emit(
        "call-ended",
        {
          endedBy:
            currentUser.id,
        }
      );
    }
  );
}