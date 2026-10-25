import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, Sequence, staticFile, Track, useVideoConfig } from "remotion";
import {
  Close,
  ColdOpen,
  Exit,
  FinderBeat,
  MatchBeat,
  MeetBeat,
  NetWorthBeat,
  NotesBeat,
  PhoneEnter,
  ProfileBeat,
  RadarBeat,
  RoomBeat,
  SummaryBeat,
  WaveBeat,
} from "./scenes";
import { BandText, Caption, Drift, Scrim, Wallpaper } from "./type";

export const Launch = () => {
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Wallpaper />
      <Drift>
        <Track name="Scenes">
          <Sequence name="Phone enters" from={4 * fps} durationInFrames={3 * fps}>
            <PhoneEnter />
          </Sequence>
          <Sequence name="1 · Radar" from={7 * fps} durationInFrames={11 * fps}>
            <RadarBeat />
          </Sequence>
          <Sequence name="2 · AI match" from={18 * fps} durationInFrames={13 * fps}>
            <MatchBeat />
          </Sequence>
          <Sequence name="3 · Build your pass" from={31 * fps} durationInFrames={15 * fps}>
            <ProfileBeat />
          </Sequence>
          <Sequence name="4 · AI summary" from={46 * fps} durationInFrames={12 * fps}>
            <SummaryBeat />
          </Sequence>
          <Sequence name="5 · Net worth" from={58 * fps} durationInFrames={12 * fps}>
            <NetWorthBeat />
          </Sequence>
          <Sequence name="6 · The room" from={70 * fps} durationInFrames={12 * fps}>
            <RoomBeat />
          </Sequence>
          <Sequence name="7 · Wave" from={82 * fps} durationInFrames={10 * fps}>
            <WaveBeat />
          </Sequence>
          <Sequence name="8 · Finder" from={92 * fps} durationInFrames={11 * fps}>
            <FinderBeat />
          </Sequence>
          <Sequence name="9 · Proof of meet" from={103 * fps} durationInFrames={12 * fps}>
            <MeetBeat />
          </Sequence>
          <Sequence name="10 · Notes and export" from={115 * fps} durationInFrames={13 * fps}>
            <NotesBeat />
          </Sequence>
          <Sequence name="Exit" from={128 * fps} durationInFrames={1.2 * fps}>
            <Exit />
          </Sequence>
        </Track>
      </Drift>
      <Scrim />
      <Track name="Captions">
        <Sequence name="Radius" from={4 * fps} durationInFrames={3 * fps}>
          <BandText />
        </Sequence>
        <Sequence name="Everyone nearby" from={7 * fps} durationInFrames={11 * fps}>
          <Caption
            title="Everyone nearby"
            lines={[
              [0.85, "Placed by Bluetooth signal strength. No accounts, no Wi-Fi."],
              [4.2, "Filter the room by role, or just the people who fit you."],
              [7.0, "Tap anyone for their pass: what they build, need and offer."],
            ]}
          />
        </Sequence>
        <Sequence name="AI reads the room" from={18 * fps} durationInFrames={13 * fps}>
          <Caption
            title="AI reads the room"
            lines={[
              [0.85, "AI ranks the room for you: who has what you need, and who needs what you offer."],
              [4.6, "Not sure what to say? Tap for an AI icebreaker."],
              [6.8, "Written for that one person, from both of your profiles."],
              [9.6, "Offline? Radius still matches you on shared interests."],
            ]}
          />
        </Sequence>
        <Sequence name="Build your pass" from={31 * fps} durationInFrames={15 * fps}>
          <Caption
            title="Build your pass"
            lines={[
              [0.85, "Your pass is how people find you. Set it up in a minute."],
              [1.6, "Add a photo, or roll a new avatar."],
              [3.8, "Say what you are, what you're building, and a bit about you."],
              [7.9, "Pick what you're looking for, and what you can offer."],
              [11.0, "Add your socials so people can follow up later."],
            ]}
          />
        </Sequence>
        <Sequence name="No more pitch decks" from={46 * fps} durationInFrames={12 * fps}>
          <Caption
            title="No more pitch decks"
            lines={[
              [0.85, "Add your website to your pass."],
              [5.6, "AI reads the site and sums up what you do."],
              [8.5, "Labelled as AI on your pass, and it sharpens your matches."],
            ]}
          />
        </Sequence>
        <Sequence name="Flex your bags, provably" from={58 * fps} durationInFrames={12 * fps}>
          <Caption
            title="Flex your bags, provably"
            lines={[
              [0.85, "Connect a wallet and sign once to prove it's yours."],
              [3.6, "Your net worth lands on your pass, verified."],
              [6.8, "Rather keep the number private? Show your tier instead."],
              [9.4, "From shrimp to whale."],
            ]}
          />
        </Sequence>
        <Sequence name="Know the room" from={70 * fps} durationInFrames={12 * fps}>
          <Caption
            title="Know the room"
            lines={[
              [0.85, "How many people are here, and the mix of roles."],
              [4.0, "Total verified net worth, with a leaderboard."],
              [7.8, "What the room is looking for, and what it can offer."],
            ]}
          />
        </Sequence>
        <Sequence name="Say hi without saying hi" from={82 * fps} durationInFrames={10 * fps}>
          <Caption
            title="Say hi without saying hi"
            lines={[
              [0.85, "One tap buzzes their phone. No numbers, no handles."],
              [3.2, "They see who waved, wherever they are in the room."],
              [5.4, "And wave back with one tap."],
            ]}
          />
        </Sequence>
        <Sequence name="Hot or cold" from={92 * fps} durationInFrames={11 * fps}>
          <Caption
            title="Hot or cold"
            lines={[
              [0.85, "Lost them in the crowd? Follow their Bluetooth signal."],
              [5.7, "Warmer and faster as you close in, until you're face to face."],
            ]}
          />
        </Sequence>
        <Sequence name="Proof you met" from={103 * fps} durationInFrames={12 * fps}>
          <Caption
            title="Proof you met"
            lines={[
              [0.85, "Tap We met, and they confirm on their phone."],
              [4.1, "Both phones sign the meeting with their own keys."],
              [6.6, "Minted as an attestation on Base. Radius covers the gas."],
            ]}
          />
        </Sequence>
        <Sequence name="Remember everyone" from={115 * fps} durationInFrames={13 * fps}>
          <Caption
            title="Remember everyone"
            lines={[
              [0.85, "Jot a private note. It never leaves your phone."],
              [5.5, "Everyone you met, with stamps and notes, in one list."],
              [8.2, "Export them all as plain text, anywhere you like."],
            ]}
          />
        </Sequence>
      </Track>
      <Track name="Music">
        {/* "Hackbeat" by Kevin MacLeod (incompetech.com), CC BY 4.0: credit it wherever the video is posted. */}
        <Audio
          name="Hackbeat"
          src={staticFile("music/hackbeat.mp3")}
          durationInFrames={durationInFrames}
          volume={(f) =>
            interpolate(
              f,
              // muted under the cold open, full on "tool", ducked ~3 dB under wave back and the stamp,
              // thinning at the exit and gone on the final cut to black
              [0, 1.9 * fps, 2.1 * fps, 87.2 * fps, 87.4 * fps, 89 * fps, 89.4 * fps, 109.4 * fps, 109.6 * fps, 111.4 * fps, 111.8 * fps, 128 * fps, 130 * fps, 135.8 * fps],
              [0.12, 0.12, 0.38, 0.38, 0.27, 0.27, 0.38, 0.38, 0.27, 0.27, 0.38, 0.38, 0.24, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            )
          }
        />
      </Track>
      <Track name="Type">
        <Sequence name="Cold open" durationInFrames={4 * fps}>
          <ColdOpen />
        </Sequence>
        <Sequence name="Close" from={129.2 * fps} durationInFrames={7 * fps}>
          <Close />
        </Sequence>
      </Track>
    </AbsoluteFill>
  );
};
