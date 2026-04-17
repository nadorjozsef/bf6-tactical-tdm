import { UI } from 'bf6-portal-utils/ui/index.ts';
import { UIContainer } from 'bf6-portal-utils/ui/components/container/index.ts';
import { UIText } from 'bf6-portal-utils/ui/components/text/index.ts';
import { SolidUI } from 'bf6-portal-utils/solid-ui/index.ts';

export class GameUI {
    public playerLivesUI(player: mod.Player, livesSignal: SolidUI.Accessor<number>): UIContainer {
        const livesUI = SolidUI.h(UIContainer, {
            position: { x: 300, y: 60 },
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
            textColor: UI.COLORS.WHITE,
            receiver: player,
            parent: livesUI,
        });
        return livesUI;
    }

    public leftTeamScoreUI(scoreSignal: SolidUI.Accessor<number>): UIContainer {
        const scoreContainer = SolidUI.h(UIContainer, {
            position: { x: -120, y: 60 },
            size: { width: 100, height: 50 },
            anchor: mod.UIAnchor.TopCenter,
            visible: true,
            bgColor: mod.CreateVector(0.0745, 0.1843, 0.2471),
            bgAlpha: 0.75,
            bgFill: mod.UIBgFill.Solid,
        });
        SolidUI.h(UIText, {
            position: { x: 0, y: 0 },
            size: { width: 100, height: 50 },
            anchor: mod.UIAnchor.Center,
            visible: true,
            bgAlpha: 0.75,
            bgFill: mod.UIBgFill.None,
            message: () => mod.Message(mod.stringkeys.team1Score, scoreSignal()),
            textColor: mod.CreateVector(0.4392, 0.9216, 1),
            textSize: 28,
            textAnchor: mod.UIAnchor.Center,
            parent: scoreContainer,
        });
        return scoreContainer;
    }

    public rightTeamScoreUI(scoreSignal: SolidUI.Accessor<number>): UIContainer {
        const scoreContainer = SolidUI.h(UIContainer, {
            position: { x: 120, y: 60 },
            size: { width: 100, height: 50 },
            anchor: mod.UIAnchor.TopCenter,
            visible: true,
            bgColor: mod.CreateVector(0.251, 0.0941, 0.0667),
            bgAlpha: 0.75,
            bgFill: mod.UIBgFill.Solid,
        });
        SolidUI.h(UIText, {
            position: { x: 0, y: 0 },
            size: { width: 100, height: 50 },
            anchor: mod.UIAnchor.Center,
            visible: true,
            bgAlpha: 0.75,
            bgFill: mod.UIBgFill.None,
            message: () => mod.Message(mod.stringkeys.team1Score, scoreSignal()),
            textColor: mod.CreateVector(1, 0.5137, 0.3804),
            textSize: 28,
            textAnchor: mod.UIAnchor.Center,
            parent: scoreContainer,
        });
        return scoreContainer;
    }

    public displayNextReinforcements(nextReinforcementsTimeSignal: SolidUI.Accessor<number>): UIContainer {
        const reinforcementsTimerContainer = SolidUI.h(UIContainer, {
            position: { x: 0, y: 60 },
            size: { width: 100, height: 50 },
            anchor: mod.UIAnchor.TopCenter,
            visible: true,
            bgColor: mod.CreateVector(0.3294, 0.3686, 0.3882),
            bgAlpha: 0.75,
            bgFill: mod.UIBgFill.Solid,
        });

        SolidUI.h(UIText, {
            position: { x: 0, y: 0 },
            size: { width: 100, height: 34.79 },
            anchor: mod.UIAnchor.BottomCenter,
            visible: true,
            bgColor: mod.CreateVector(0.4392, 0.9216, 1),
            bgAlpha: 0.75,
            bgFill: mod.UIBgFill.None,
            message: () => mod.Message(mod.stringkeys.reinforcementsTime, nextReinforcementsTimeSignal()),
            textColor: mod.CreateVector(1, 1, 1),
            textSize: 28,
            textAnchor: mod.UIAnchor.Center,
            parent: reinforcementsTimerContainer,
        });

        SolidUI.h(UIText, {
            position: { x: 0, y: 0 },
            size: { width: 100, height: 20.24 },
            anchor: mod.UIAnchor.TopCenter,
            visible: true,
            bgColor: mod.CreateVector(0.2, 0.2, 0.2),
            bgAlpha: 1,
            bgFill: mod.UIBgFill.None,
            message: mod.Message(mod.stringkeys.reinforcementsLabel),
            textColor: mod.CreateVector(1, 1, 1),
            textSize: 12,
            textAnchor: mod.UIAnchor.Center,
            parent: reinforcementsTimerContainer,
        });

        return reinforcementsTimerContainer;
    }

    public activePlayersUI(
        team1ActivePlayerSignal: SolidUI.Accessor<number>,
        team2ActivePlayerSignal: SolidUI.Accessor<number>
    ): UIContainer {
        const playerCountContainer = SolidUI.h(UIContainer, {
            position: { x: 0, y: 130 },
            size: { width: 150, height: 50 },
            anchor: mod.UIAnchor.TopCenter,
            bgColor: mod.CreateVector(0.2, 0.2, 0.2),
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
        });

        SolidUI.h(UIText, {
            position: { x: 0, y: 0 },
            size: { width: 50, height: 50 },
            anchor: mod.UIAnchor.CenterLeft,
            bgColor: mod.CreateVector(0.2, 0.2, 0.2),
            bgAlpha: 1,
            bgFill: mod.UIBgFill.None,
            message: () => mod.Message(mod.stringkeys.team1ActivePlayersText, team1ActivePlayerSignal()),
            textColor: mod.CreateVector(0.4392, 0.9216, 1),
            textSize: 24,
            textAnchor: mod.UIAnchor.Center,
            parent: playerCountContainer,
        });

        SolidUI.h(UIText, {
            position: { x: 0, y: 0 },
            size: { width: 50, height: 50 },
            anchor: mod.UIAnchor.CenterRight,
            bgColor: mod.CreateVector(0.2, 0.2, 0.2),
            bgAlpha: 1,
            bgFill: mod.UIBgFill.None,
            message: () => mod.Message(mod.stringkeys.team2ActivePlayersText, team2ActivePlayerSignal()),
            textColor: mod.CreateVector(1, 0.5137, 0.3804),
            textSize: 24,
            textAnchor: mod.UIAnchor.Center,
            parent: playerCountContainer,
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
            textSize: 24,
            textAnchor: mod.UIAnchor.Center,
            parent: playerCountContainer,
        });

        return playerCountContainer;
    }
}