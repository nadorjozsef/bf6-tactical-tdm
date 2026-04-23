import { UI } from 'bf6-portal-utils/ui/index.ts';
import { UIContainer } from 'bf6-portal-utils/ui/components/container/index.ts';
import { UIText } from 'bf6-portal-utils/ui/components/text/index.ts';
import { SolidUI } from 'bf6-portal-utils/solid-ui/index.ts';
import { Timers } from 'bf6-portal-utils/timers';

export class GameUI {
    private static _instance: GameUI | undefined;

    private constructor() { }

    static getInstance(): GameUI {
        if (!GameUI._instance) {
            GameUI._instance = new GameUI();
        }
        return GameUI._instance;
    }

    public capturePointA(): UIContainer {
        const container = SolidUI.h(UIContainer, {
            position: { x: 0, y: 95 },
            size: { width: 32, height: 32 },
            bgColor: UI.COLORS.BF_BLUE_DARK,
            bgFill: mod.UIBgFill.Solid,
            bgAlpha: 0.75,
            visible: true,
            depth: mod.UIDepth.BelowGameUI,
            anchor: mod.UIAnchor.TopCenter
        });

        SolidUI.h(UIText, {
            message: () => mod.Message(mod.stringkeys.score, 'A'),
            textSize: 24,
            width: 32,
            textColor: UI.COLORS.BF_BLUE_BRIGHT,
            parent: container,
        });
        SolidUI.h(UIContainer, {
            position: { x: 0, y: 0 },
            size: { width: 32, height: 2 },
            bgColor: UI.COLORS.BF_BLUE_BRIGHT,
            bgFill: mod.UIBgFill.Solid,
            bgAlpha: 1,
            visible: true,
            depth: mod.UIDepth.BelowGameUI,
            anchor: mod.UIAnchor.TopCenter,
            parent: container
        });
        SolidUI.h(UIContainer, {
            position: { x: 0, y: 0 },
            size: { width: 32, height: 2 },
            bgColor: UI.COLORS.BF_BLUE_BRIGHT,
            bgFill: mod.UIBgFill.Solid,
            bgAlpha: 1,
            visible: true,
            depth: mod.UIDepth.BelowGameUI,
            anchor: mod.UIAnchor.BottomCenter,
            parent: container
        });
        SolidUI.h(UIContainer, {
            position: { x: 0, y: 0 },
            size: { width: 2, height: 32 },
            bgColor: UI.COLORS.BF_BLUE_BRIGHT,
            bgFill: mod.UIBgFill.Solid,
            bgAlpha: 1,
            visible: true,
            depth: mod.UIDepth.BelowGameUI,
            anchor: mod.UIAnchor.CenterLeft,
            parent: container
        });
        SolidUI.h(UIContainer, {
            position: { x: 0, y: 0 },
            size: { width: 2, height: 32 },
            bgColor: UI.COLORS.BF_BLUE_BRIGHT,
            bgFill: mod.UIBgFill.Solid,
            bgAlpha: 1,
            visible: true,
            depth: mod.UIDepth.BelowGameUI,
            anchor: mod.UIAnchor.CenterRight,
            parent: container
        });

        return container;
    }

    public teamScore(team: mod.Team, scoreSignal: SolidUI.Accessor<number>, variantName: 'leftVariant' | 'rightVariant'): UIContainer {
        const [alphaSignal, setAlphaSignal] = SolidUI.createSignal(0);
        SolidUI.createEffect(() => {
            scoreSignal();
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
        const leftVariant = {
            x: -233,
            darkColor: UI.COLORS.BF_BLUE_DARK,
            brightColor: UI.COLORS.BF_BLUE_BRIGHT,
        }
        const rightVariant = {
            x: 233,
            darkColor: UI.COLORS.BF_RED_DARK,
            brightColor: UI.COLORS.BF_RED_BRIGHT,
        }
        const variant = variantName === 'leftVariant' ? leftVariant : rightVariant;

        const container = SolidUI.h(UIContainer, {
            x: variant.x,
            y: 54,
            size: { width: 84, height: 34 },
            bgColor: variant.darkColor,
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
            bgColor: variant.brightColor,
            bgFill: mod.UIBgFill.Solid,
            bgAlpha: alphaSignal,
            visible: true,
            depth: mod.UIDepth.BelowGameUI,
            anchor: mod.UIAnchor.TopLeft,
            parent: container,
            receiver: team,
        });

        SolidUI.h(UIText, {
            message: () => mod.Message(mod.stringkeys.teamScore, scoreSignal()),
            textSize: 34,
            width: 84,
            textColor: variant.brightColor,
            parent: container,
            receiver: team,
        });

        return container;
    }

    public teamScoreBar(team: mod.Team, scoreSignal: SolidUI.Accessor<number>, variantName: 'leftVariant' | 'rightVariant', maxScore: number): UIContainer {
        const CONTAINER_WIDTH = 178;
        const [widthSignal, setWidthSignal] = SolidUI.createSignal(0);
        SolidUI.createEffect(() => {
            const teamScorePercentige = scoreSignal() / maxScore * 100;
            setWidthSignal(+(teamScorePercentige / 100 * CONTAINER_WIDTH).toFixed(0));
        });
        const leftVariant = {
            x: -94,
            darkColor: UI.COLORS.BF_BLUE_DARK,
            brightColor: UI.COLORS.BF_BLUE_BRIGHT,
            anchor: mod.UIAnchor.TopLeft
        }
        const rightVariant = {
            x: 94,
            darkColor: UI.COLORS.BF_RED_DARK,
            brightColor: UI.COLORS.BF_RED_BRIGHT,
            anchor: mod.UIAnchor.TopRight
        }
        const variant = variantName === 'leftVariant' ? leftVariant : rightVariant;
        const container = SolidUI.h(UIContainer, {
            x: variant.x,
            y: 64,
            size: { width: CONTAINER_WIDTH, height: 12 },
            bgColor: variant.darkColor,
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
            bgColor: variant.brightColor,
            bgFill: mod.UIBgFill.Solid,
            bgAlpha: 0.75,
            visible: true,
            depth: mod.UIDepth.BelowGameUI,
            anchor: variant.anchor,
            parent: container,
            receiver: team,
        });

        return container;
    }

    public activePlayers(
        team: mod.Team,
        leftActivePlayerSignal: SolidUI.Accessor<number>,
        rightActivePlayerSignal: SolidUI.Accessor<number>
    ): UIContainer {
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
            message: () => mod.Message(mod.stringkeys.rightActivePlayersText, leftActivePlayerSignal()),
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
            message: () => mod.Message(mod.stringkeys.leftActivePlayersText, rightActivePlayerSignal()),
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

    public playerLives(player: mod.Player, livesSignal: SolidUI.Accessor<number>): UIContainer {
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
            message: () => mod.Message(mod.stringkeys.lifeCount, livesSignal()),
            textSize: 20,
            width: 80,
            visible: true,
            textColor: UI.COLORS.WHITE,
            receiver: player,
            parent: livesUI,
        });
        return livesUI;
    }

    public nextReinforcements(nextReinforcementsTimeSignal: SolidUI.Accessor<number>): UIContainer {
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
            message: () => mod.Message(mod.stringkeys.reinforcementsTime, nextReinforcementsTimeSignal()),
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