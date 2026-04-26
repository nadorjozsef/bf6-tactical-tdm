import { UI } from 'bf6-portal-utils/ui/index.ts';
import { UIContainer } from 'bf6-portal-utils/ui/components/container/index.ts';
import { UIText } from 'bf6-portal-utils/ui/components/text/index.ts';
import { SolidUI } from 'bf6-portal-utils/solid-ui/index.ts';
import { Timers } from 'bf6-portal-utils/timers';

interface TeamScoreProps {
    x: number;
    darkColor: mod.Vector;
    brightColor: mod.Vector;
}

interface TeamScoreBarProps {
    x: number;
    darkColor: mod.Vector;
    brightColor: mod.Vector;
    anchor: mod.UIAnchor;
    maxScore: number;
}

export class GameUI {
    private static _instance: GameUI | undefined;

    private constructor() { }

    static getInstance(): GameUI {
        if (!GameUI._instance) {
            GameUI._instance = new GameUI();
        }
        return GameUI._instance;
    }

    public capturePoints(modTeam: mod.Team, ownerTeamIdAccessors: SolidUI.Accessor<number>[], isCapturingAccessors: SolidUI.Accessor<boolean>[]): void {
        const numberOfCapturePoints = ownerTeamIdAccessors.length;
        const boxWidth = 32;
        const gap = 20;
        const step = boxWidth + gap;
        const totalWidth = numberOfCapturePoints * step;
        const start = -totalWidth / 2 + step / 2;
        const capturePointXPositions: number[] = [];
        for (let i = 0; i < numberOfCapturePoints; i++) {
            capturePointXPositions.push(start + i * step);
        }
        const letters = [
            mod.stringkeys.capturePointA,
            mod.stringkeys.capturePointB,
            mod.stringkeys.capturePointC,
            mod.stringkeys.capturePointD,
            mod.stringkeys.capturePointE,
            mod.stringkeys.capturePointF,
            mod.stringkeys.capturePointG
        ];
        for (let i = 0; i < numberOfCapturePoints; i++) {
            this.capturePoint(modTeam, ownerTeamIdAccessors[i], isCapturingAccessors[i], letters[i], capturePointXPositions[i]);
        }
    }

    private capturePoint(modTeam: mod.Team, ownerTeamIdAccessor: SolidUI.Accessor<number>, isCapturingAccessor: SolidUI.Accessor<boolean>, letter: string, xPosition: number): UIContainer {
        const [alphaSignal, setAlphaSignal] = SolidUI.createSignal(1);
        let intervalId: number | null = null;

        SolidUI.createEffect(() => {
            if (isCapturingAccessor() === true && intervalId === null) {
                let change = 0.1;
                intervalId = Timers.setInterval(() => {
                    setAlphaSignal((prev) => {
                        if (prev <= 0 || prev >= 1) change *= -1;
                        const roundnewAlpha = Math.round((prev + change) * 100) / 100;
                        return roundnewAlpha;
                    })
                }, 50, true);
            } else {
                Timers.clearInterval(intervalId);
                setAlphaSignal(1);
                intervalId = null;
            }
        });

        const mainContainer = SolidUI.h(UIContainer, {
            x: xPosition,
            y: 95,
            size: { width: 32, height: 32 },
            bgFill: mod.UIBgFill.None,
            visible: true,
            depth: mod.UIDepth.BelowGameUI,
            anchor: mod.UIAnchor.TopCenter,
            receiver: modTeam,
        });

        const blueCapturePoint = this.blueCapturePoint(modTeam, mainContainer, alphaSignal, letter);
        const grayCapturePoint = this.grayCapturePoint(modTeam, mainContainer, alphaSignal, letter);
        const redCapturePoint = this.redCapturePoint(modTeam, mainContainer, alphaSignal, letter);

        SolidUI.createEffect(() => {
            if (ownerTeamIdAccessor() === 0) {
                blueCapturePoint.hide();
                redCapturePoint.hide();
                grayCapturePoint.show();
            } else if (ownerTeamIdAccessor() === 1) {
                if (mod.GetObjId(modTeam) === 1) {
                    blueCapturePoint.show();
                    redCapturePoint.hide();
                } else if (mod.GetObjId(modTeam) === 2) {
                    blueCapturePoint.hide();
                    redCapturePoint.show();
                }
                grayCapturePoint.hide();
            } else if (ownerTeamIdAccessor() === 2) {
                if (mod.GetObjId(modTeam) === 1) {
                    blueCapturePoint.hide();
                    redCapturePoint.show();
                } else if (mod.GetObjId(modTeam) === 2) {
                    blueCapturePoint.show();
                    redCapturePoint.hide();
                }
                grayCapturePoint.hide();
            }
        });

        return grayCapturePoint;
    }

    private blueCapturePoint(modTeam: mod.Team, parent: UIContainer, alphaSignalAccessor: SolidUI.Accessor<number>, letter: string): UIContainer {
        const circleContainer = SolidUI.h(UIContainer, {
            position: { x: 0, y: 0 },
            size: { width: 32, height: 32 },
            bgFill: mod.UIBgFill.None,
            visible: true,
            depth: mod.UIDepth.BelowGameUI,
            anchor: mod.UIAnchor.Center,
            parent: parent,
            receiver: modTeam,
        });
        // outer circle
        SolidUI.h(UIText, {
            message: mod.Message(mod.stringkeys.circle),
            textSize: 40,
            width: 40,
            textColor: UI.COLORS.BF_BLUE_BRIGHT,
            textAlpha: () => alphaSignalAccessor() * 0.75,
            anchor: mod.UIAnchor.Center,
            parent: circleContainer,
            receiver: modTeam,
        });
        // inner circle
        SolidUI.h(UIText, {
            message: mod.Message(mod.stringkeys.circle),
            textSize: 37,
            width: 37,
            textColor: UI.COLORS.BF_BLUE_DARK,
            textAlpha: () => alphaSignalAccessor() * 0.75,
            anchor: mod.UIAnchor.Center,
            parent: circleContainer,
            receiver: modTeam,
        });
        // letter
        SolidUI.h(UIText, {
            message: mod.Message(letter),
            textSize: 22,
            width: 32,
            textColor: UI.COLORS.BF_BLUE_BRIGHT,
            textAlpha: () => alphaSignalAccessor() * 0.75 + 0.25,
            anchor: mod.UIAnchor.Center,
            parent: circleContainer,
            receiver: modTeam,
        });
        return circleContainer;
    }

    private redCapturePoint(modTeam: mod.Team, parent: UIContainer, alphaSignalAccessor: SolidUI.Accessor<number>, letter: string): UIContainer {
        const squareContainer = SolidUI.h(UIContainer, {
            position: { x: 0, y: 0 },
            size: { width: 32, height: 32 },
            bgFill: mod.UIBgFill.None,
            visible: true,
            depth: mod.UIDepth.BelowGameUI,
            anchor: mod.UIAnchor.Center,
            parent: parent,
            receiver: modTeam
        });
        // outer square
        SolidUI.h(UIContainer, {
            position: { x: 0, y: 0 },
            size: { width: 32, height: 32 },
            bgColor: UI.COLORS.BF_RED_BRIGHT,
            bgFill: mod.UIBgFill.Solid,
            bgAlpha: () => alphaSignalAccessor() * 0.75,
            visible: true,
            depth: mod.UIDepth.BelowGameUI,
            anchor: mod.UIAnchor.Center,
            parent: squareContainer,
            receiver: modTeam,
        });
        // inner square
        SolidUI.h(UIContainer, {
            position: { x: 0, y: 0 },
            size: { width: 28, height: 28 },
            bgColor: UI.COLORS.BF_RED_DARK,
            bgFill: mod.UIBgFill.Solid,
            bgAlpha: () => alphaSignalAccessor() * 0.75,
            visible: true,
            depth: mod.UIDepth.BelowGameUI,
            anchor: mod.UIAnchor.Center,
            parent: squareContainer,
            receiver: modTeam,
        });
        // letter
        SolidUI.h(UIText, {
            message: mod.Message(letter),
            textSize: 22,
            width: 32,
            textColor: UI.COLORS.BF_RED_BRIGHT,
            textAlpha: () => alphaSignalAccessor() * 0.75 + 0.25,
            anchor: mod.UIAnchor.Center,
            parent: squareContainer,
            receiver: modTeam,
        });

        return squareContainer;
    }

    private grayCapturePoint(modTeam: mod.Team, parent: UIContainer, alphaSignalAccessor: SolidUI.Accessor<number>, letter: string): UIContainer {
        const squareContainer = SolidUI.h(UIContainer, {
            position: { x: 0, y: 0 },
            size: { width: 32, height: 32 },
            bgFill: mod.UIBgFill.None,
            visible: true,
            depth: mod.UIDepth.BelowGameUI,
            anchor: mod.UIAnchor.Center,
            parent: parent,
            receiver: modTeam,
        });
        // outer square
        SolidUI.h(UIContainer, {
            position: { x: 0, y: 0 },
            size: { width: 32, height: 32 },
            bgColor: UI.COLORS.BF_GREY_1,
            bgFill: mod.UIBgFill.Solid,
            bgAlpha: () => alphaSignalAccessor() * 0.75,
            visible: true,
            depth: mod.UIDepth.BelowGameUI,
            anchor: mod.UIAnchor.Center,
            parent: squareContainer,
            receiver: modTeam,
        });
        // inner square
        SolidUI.h(UIContainer, {
            position: { x: 0, y: 0 },
            size: { width: 28, height: 28 },
            bgColor: UI.COLORS.BF_GREY_4,
            bgFill: mod.UIBgFill.Solid,
            bgAlpha: () => alphaSignalAccessor() * 0.75,
            visible: true,
            depth: mod.UIDepth.BelowGameUI,
            anchor: mod.UIAnchor.Center,
            parent: squareContainer,
            receiver: modTeam,
        });
        // letter
        SolidUI.h(UIText, {
            message: mod.Message(letter),
            textSize: 22,
            width: 32,
            textColor: UI.COLORS.BF_GREY_1,
            textAlpha: () => alphaSignalAccessor() * 0.75 + 0.25,
            anchor: mod.UIAnchor.Center,
            parent: squareContainer,
            receiver: modTeam,
        });

        return squareContainer;
    }

    public teamScores(modTeam: mod.Team, teamScoreAccessor: SolidUI.Accessor<number>, opponentScoreAccessor: SolidUI.Accessor<number>): void {
        this.teamScore(modTeam, teamScoreAccessor, {
            x: -233,
            darkColor: UI.COLORS.BF_BLUE_DARK,
            brightColor: UI.COLORS.BF_BLUE_BRIGHT,
        });
        this.teamScore(modTeam, opponentScoreAccessor, {
            x: 233,
            darkColor: UI.COLORS.BF_RED_DARK,
            brightColor: UI.COLORS.BF_RED_BRIGHT,
        });
    }

    private teamScore(team: mod.Team, scoreAccessor: SolidUI.Accessor<number>, props: TeamScoreProps): UIContainer {
        const [alphaSignal, setAlphaSignal] = SolidUI.createSignal(0);

        SolidUI.createEffect(() => {
            scoreAccessor();
            const intervalId = Timers.setInterval(() => {
                setAlphaSignal((prev) => {
                    if (prev < 1) {
                        prev += 0.1;
                    } else {
                        prev = 0;
                        Timers.clearInterval(intervalId);
                    }
                    return prev;
                })
            }, 50, true);
        });

        const container = SolidUI.h(UIContainer, {
            x: props.x,
            y: 54,
            size: { width: 84, height: 34 },
            bgColor: props.darkColor,
            bgFill: mod.UIBgFill.Solid,
            bgAlpha: 0.75,
            visible: true,
            depth: mod.UIDepth.BelowGameUI,
            anchor: mod.UIAnchor.TopCenter,
            receiver: team,
        });

        SolidUI.h(UIContainer, {
            position: { x: 0, y: 0 },
            size: { width: 84, height: 34 },
            bgColor: props.brightColor,
            bgFill: mod.UIBgFill.Solid,
            bgAlpha: alphaSignal,
            visible: true,
            depth: mod.UIDepth.BelowGameUI,
            anchor: mod.UIAnchor.TopLeft,
            parent: container,
            receiver: team,
        });

        SolidUI.h(UIText, {
            message: () => mod.Message(mod.stringkeys.teamScore, scoreAccessor()),
            textSize: 34,
            width: 84,
            textColor: props.brightColor,
            parent: container,
            receiver: team,
        });

        return container;
    }

    public teamScoreBars(modTeam: mod.Team, teamScoreAccessor: SolidUI.Accessor<number>, opponentScoreAccessor: SolidUI.Accessor<number>, maxScore: number): void {
        this.teamScoreBar(modTeam, teamScoreAccessor, {
            x: -94,
            darkColor: UI.COLORS.BF_BLUE_DARK,
            brightColor: UI.COLORS.BF_BLUE_BRIGHT,
            anchor: mod.UIAnchor.TopLeft,
            maxScore,
        });
        this.teamScoreBar(modTeam, opponentScoreAccessor, {
            x: 94,
            darkColor: UI.COLORS.BF_RED_DARK,
            brightColor: UI.COLORS.BF_RED_BRIGHT,
            anchor: mod.UIAnchor.TopRight,
            maxScore,
        });
    }

    private teamScoreBar(team: mod.Team, scoreAccessor: SolidUI.Accessor<number>, props: TeamScoreBarProps): UIContainer {
        const CONTAINER_WIDTH = 178;
        const [widthSignal, setWidthSignal] = SolidUI.createSignal(0);

        SolidUI.createEffect(() => {
            const teamScorePercentige = scoreAccessor() / props.maxScore * 100;
            setWidthSignal(+(teamScorePercentige / 100 * CONTAINER_WIDTH).toFixed(0));
        });

        const container = SolidUI.h(UIContainer, {
            x: props.x,
            y: 64,
            size: { width: CONTAINER_WIDTH, height: 12 },
            bgColor: props.darkColor,
            bgFill: mod.UIBgFill.Solid,
            bgAlpha: 0.75,
            visible: true,
            depth: mod.UIDepth.BelowGameUI,
            anchor: mod.UIAnchor.TopCenter,
            receiver: team,
        });

        SolidUI.h(UIContainer, {
            position: { x: 0, y: 0 },
            width: widthSignal,
            height: 12,
            bgColor: props.brightColor,
            bgFill: mod.UIBgFill.Solid,
            bgAlpha: 0.75,
            visible: true,
            depth: mod.UIDepth.BelowGameUI,
            anchor: props.anchor,
            parent: container,
            receiver: team,
        });

        return container;
    }

    public activePlayers(team: mod.Team, leftActivePlayerAccessor: SolidUI.Accessor<number>, rightActivePlayerAccessor: SolidUI.Accessor<number>): UIContainer {
        const playerCountContainer = SolidUI.h(UIContainer, {
            position: { x: 0, y: 130 },
            size: { width: 150, height: 50 },
            anchor: mod.UIAnchor.TopCenter,
            bgColor: mod.CreateVector(0.2, 0.2, 0.2),
            visible: true,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            receiver: team,
        });

        SolidUI.h(UIText, {
            position: { x: 0, y: 0 },
            size: { width: 50, height: 50 },
            anchor: mod.UIAnchor.CenterLeft,
            bgColor: mod.CreateVector(0.2, 0.2, 0.2),
            bgAlpha: 1,
            visible: true,
            bgFill: mod.UIBgFill.None,
            message: () => mod.Message(mod.stringkeys.rightActivePlayersText, leftActivePlayerAccessor()),
            textColor: mod.CreateVector(0.4392, 0.9216, 1),
            textSize: 28,
            textAnchor: mod.UIAnchor.Center,
            parent: playerCountContainer,
            receiver: team,
        });

        SolidUI.h(UIText, {
            position: { x: 0, y: 0 },
            size: { width: 50, height: 50 },
            anchor: mod.UIAnchor.CenterRight,
            bgColor: mod.CreateVector(0.2, 0.2, 0.2),
            bgAlpha: 1,
            visible: true,
            bgFill: mod.UIBgFill.None,
            message: () => mod.Message(mod.stringkeys.leftActivePlayersText, rightActivePlayerAccessor()),
            textColor: mod.CreateVector(1, 0.5137, 0.3804),
            textSize: 28,
            textAnchor: mod.UIAnchor.Center,
            parent: playerCountContainer,
            receiver: team,
        });

        SolidUI.h(UIText, {
            position: { x: 0, y: 0 },
            size: { width: 50, height: 50 },
            anchor: mod.UIAnchor.Center,
            visible: true,
            padding: 0,
            bgColor: mod.CreateVector(0.2, 0.2, 0.2),
            bgAlpha: 1,
            bgFill: mod.UIBgFill.None,
            message: mod.Message(mod.stringkeys.activePlayersTextCenter),
            textColor: mod.CreateVector(1, 1, 1),
            textSize: 28,
            textAnchor: mod.UIAnchor.Center,
            parent: playerCountContainer,
        });

        return playerCountContainer;
    }

    public playerLives(player: mod.Player, livesAccessor: SolidUI.Accessor<number>): UIContainer {
        const livesUI = SolidUI.h(UIContainer, {
            position: { x: 400, y: 20 },
            size: { width: 100, height: 50 },
            bgColor: UI.COLORS.BLACK,
            bgFill: mod.UIBgFill.Solid,
            bgAlpha: 0.75,
            visible: true,
            depth: mod.UIDepth.BelowGameUI,
            anchor: mod.UIAnchor.TopCenter,
            receiver: player,
        });
        SolidUI.h(UIText, {
            message: () => mod.Message(mod.stringkeys.lifeCount, livesAccessor()),
            textSize: 20,
            width: 80,
            visible: true,
            textColor: UI.COLORS.WHITE,
            receiver: player,
            parent: livesUI,
        });
        return livesUI;
    }

    public nextReinforcements(nextReinforcementsTimeAccessor: SolidUI.Accessor<number>): UIContainer {
        const reinforcementsTimerContainer = SolidUI.h(UIContainer, {
            position: { x: 550, y: 20 },
            size: { width: 100, height: 50 },
            anchor: mod.UIAnchor.TopCenter,
            visible: true,
            bgColor: UI.COLORS.BLACK,
            bgAlpha: 0.75,
            bgFill: mod.UIBgFill.Solid,
        });

        SolidUI.h(UIText, {
            position: { x: 0, y: 0 },
            size: { width: 100, height: 34 },
            anchor: mod.UIAnchor.BottomCenter,
            visible: true,
            message: () => mod.Message(mod.stringkeys.reinforcementsTime, nextReinforcementsTimeAccessor()),
            textColor: mod.CreateVector(1, 1, 1),
            textSize: 28,
            textAnchor: mod.UIAnchor.Center,
            parent: reinforcementsTimerContainer,
        });

        SolidUI.h(UIText, {
            position: { x: 0, y: 0 },
            size: { width: 100, height: 20 },
            anchor: mod.UIAnchor.TopCenter,
            visible: true,
            message: mod.Message(mod.stringkeys.reinforcementsLabel),
            textColor: UI.COLORS.WHITE,
            textSize: 12,
            textAnchor: mod.UIAnchor.Center,
            parent: reinforcementsTimerContainer,
        });

        return reinforcementsTimerContainer;
    }
}