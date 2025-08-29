import { Client, Room } from 'colyseus.js';
import { Constants, Maths, Models, Types } from '@tosios/common';
import { HUD, HUDProps } from './HUD';
import React, { Component, RefObject } from 'react';
import { RouteComponentProps, navigate } from '@reach/router';
import { Game } from '../game/Game';
import { Helmet } from 'react-helmet';
import ReactNipple from 'react-nipple';
import { View, Button, Text, Space, Select, IListItem } from '../components';
import { isMobile } from 'react-device-detect';
import qs from 'querystringify';

interface IProps extends RouteComponentProps {
    roomId?: string;
}

interface IState {
    hud: HUDProps;
    showCharacterSelect: boolean;
    selectedCharacter: string;
}

export default class Match extends Component<IProps, IState> {
    private canvasRef: RefObject<HTMLDivElement>;

    private game: Game;

    private client?: Client;

    private room?: Room;

    private timer: NodeJS.Timeout | null = null;

    // BASE
    constructor(props: IProps) {
        super(props);

        this.canvasRef = React.createRef();
        this.game = new Game(window.innerWidth, window.innerHeight, this.handleActionSend);

        this.state = {
            hud: {
                gameMode: '',
                gameMap: '',
                gameModeEndsAt: 0,
                roomName: '',
                playerId: '',
                playerName: '',
                playerLives: 0,
                playerMaxLives: 0,
                players: [],
                playersCount: 0,
                playersMaxCount: 0,
                messages: [],
                announce: '',
            },
            showCharacterSelect: false,
            selectedCharacter: localStorage.getItem('characterType') || Constants.CHARACTER_DEFAULT,
        };
    }

    componentDidMount() {
        this.start();
    }

    componentWillUnmount() {
        this.stop();
    }

    // LIFECYCLE
    start = async () => {
        const { roomId = '', location: { search = '' } = {} } = this.props;

        const isNewRoom = roomId === 'new';
        const parsedSearch = qs.parse(search) as Types.IRoomOptions;

        let options;
        if (isNewRoom) {
            options = {
                ...parsedSearch,
                roomMaxPlayers: Number(parsedSearch.roomMaxPlayers),
            };
        } else {
            // When joining an existing room, pass player's name
            // Character will be chosen after joining the game
            options = {
                playerName: localStorage.getItem('playerName'),
            };
        }

        // Connect
        try {
            const host = window.document.location.host.replace(/:.*/, '');
            const port = process.env.NODE_ENV !== 'production' ? Constants.WS_PORT : window.location.port;
            const url = `${window.location.protocol.replace('http', 'ws')}//${host}${port ? `:${port}` : ''}`;

            this.client = new Client(url);
            if (isNewRoom) {
                this.room = await this.client.create(Constants.ROOM_NAME, options);

                // We replace the "new" in the URL with the room's id
                window.history.replaceState(null, '', `/${this.room.id}`);
            } else {
                this.room = await this.client.joinById(roomId, options);
            }
        } catch (error) {
            navigate('/');
            return;
        }

        // Set the current player id
        this.setState((prev) => ({
            ...prev,
            hud: {
                ...prev.hud,
                playerId: this.room ? this.room.sessionId : '',
            },
        }));

        // Listen for state changes
        this.room.state.game.onChange = this.handleGameChange;
        this.room.state.players.onAdd = this.handlePlayerAdd;
        this.room.state.players.onRemove = this.handlePlayerRemove;
        this.room.state.monsters.onAdd = this.handleMonsterAdd;
        this.room.state.monsters.onRemove = this.handleMonsterRemove;
        this.room.state.props.onAdd = this.handlePropAdd;
        this.room.state.props.onRemove = this.handlePropRemove;
        this.room.state.bullets.onAdd = this.handleBulletAdd;
        this.room.state.bullets.onRemove = this.handleBulletRemove;

        // Listen for Messages
        this.room.onMessage('*', this.handleMessage);

        // Start game
        this.game.start(this.canvasRef.current);

        // Listen for inputs
        window.addEventListener('resize', this.handleWindowResize);

        // Start players refresh listeners
        this.timer = setInterval(this.updateRoom, Constants.PLAYERS_REFRESH);

        // Show character selection interface
        this.setState({ showCharacterSelect: true });
    };

    stop = () => {
        // Colyseus
        if (this.room) {
            this.room.leave();
        }

        // Game
        this.game.stop();

        // Inputs
        window.removeEventListener('resize', this.handleWindowResize);

        // Start players refresh listeners
        if (this.timer) {
            clearInterval(this.timer);
        }
    };

    // HANDLERS: Colyseus
    handleGameChange = (attributes: any) => {
        for (const row of attributes) {
            this.game.gameUpdate(row.field, row.value);
        }
    };

    handlePlayerAdd = (player: any, playerId: string) => {
        const isMe = this.isPlayerIdMe(playerId);
        this.game.playerAdd(playerId, player, isMe);
        this.updateRoom();

        player.onChange = () => {
            this.handlePlayerUpdate(player, playerId);
        };
    };

    handlePlayerUpdate = (player: any, playerId: string) => {
        const isMe = this.isPlayerIdMe(playerId);
        this.game.playerUpdate(playerId, player, isMe);
    };

    handlePlayerRemove = (player: Models.PlayerJSON, playerId: string) => {
        const isMe = this.isPlayerIdMe(playerId);
        this.game.playerRemove(playerId, isMe);
        this.updateRoom();
    };

    handleMonsterAdd = (monster: any, monsterId: string) => {
        this.game.monsterAdd(monsterId, monster);

        monster.onChange = () => {
            this.handleMonsterUpdate(monster, monsterId);
        };
    };

    handleMonsterUpdate = (monster: Models.MonsterJSON, monsterId: string) => {
        this.game.monsterUpdate(monsterId, monster);
    };

    handleMonsterRemove = (monster: Models.MonsterJSON, monsterId: string) => {
        this.game.monsterRemove(monsterId);
    };

    handlePropAdd = (prop: any, propId: string) => {
        this.game.propAdd(propId, prop);

        prop.onChange = () => {
            this.handlePropUpdate(prop, propId);
        };
    };

    handlePropUpdate = (prop: Models.PropJSON, propId: string) => {
        this.game.propUpdate(propId, prop);
    };

    handlePropRemove = (prop: Models.PropJSON, propId: string) => {
        this.game.propRemove(propId);
    };

    handleBulletAdd = (bullet: Models.BulletJSON, bulletId: string) => {
        this.game.bulletAdd(bulletId, bullet);
    };

    handleBulletRemove = (bullet: Models.BulletJSON, bulletId: string) => {
        this.game.bulletRemove(bulletId);
    };

    handleMessage = (type: any, message: Models.MessageJSON) => {
        const { messages } = this.state.hud;

        let announce: string | undefined;
        switch (type) {
            case 'waiting':
                announce = `Waiting for other players...`;
                break;
            case 'start':
                announce = `Game starts`;
                break;
            case 'won':
                announce = `${message.params.name} wins!`;
                break;
            case 'timeout':
                announce = `Timeout...`;
                break;
            case 'characterChanged':
                announce = `Игрок сменил персонажа`;
                break;
            default:
                break;
        }

        this.setState((prev) => ({
            hud: {
                ...prev.hud,
                // Only set the last n messages (negative value on slice() is reverse)
                messages: [...messages, message].slice(-Constants.LOG_LINES_MAX),
                announce,
            },
        }));

        this.updateRoom();
    };

    // HANDLERS: GameManager
    handleActionSend = (action: Models.ActionJSON) => {
        if (!this.room) {
            return;
        }

        this.room.send(action.type, action);
    };

    handleCharacterSelect = (characterType: string) => {
        this.setState({
            selectedCharacter: characterType,
        });
    };

    handleCharacterConfirm = () => {
        const { selectedCharacter } = this.state;

        // Save to localStorage
        localStorage.setItem('characterType', selectedCharacter);

        // Send to server
        if (this.room) {
            this.room.send('changeCharacter', { characterType: selectedCharacter });
        }

        // Hide character selection
        this.setState({ showCharacterSelect: false });
    };

    // HANDLERS: Inputs
    handleWindowResize = () => {
        this.game.setScreenSize(window.innerWidth, window.innerHeight);
    };

    // METHODS
    isPlayerIdMe = (playerId: string) => {
        return this.state.hud.playerId === playerId;
    };

    updateRoom = () => {
        const stats = this.game.getStats();

        this.setState((prev) => ({
            ...prev,
            hud: {
                ...prev.hud,
                ...stats,
            },
        }));
    };

    // RENDER
    render() {
        const { hud } = this.state;

        return (
            <View
                style={{
                    position: 'relative',
                    height: '100%',
                }}
            >
                {/* Set page's title */}
                <Helmet>
                    <title>{`${hud.roomName || hud.gameMode} [${hud.playersCount}]`}</title>
                </Helmet>

                {/* Where PIXI is injected */}
                <div ref={this.canvasRef} />

                {/* Joysticks */}
                {isMobile && this.renderJoySticks()}

                {/* HUD: GUI, menu, leaderboard */}
                <HUD
                    playerId={hud.playerId}
                    gameMode={hud.gameMode}
                    gameMap={hud.gameMap}
                    gameModeEndsAt={hud.gameModeEndsAt}
                    roomName={hud.roomName}
                    playerName={hud.playerName}
                    playerLives={hud.playerLives}
                    playerMaxLives={hud.playerMaxLives}
                    players={hud.players}
                    playersCount={hud.playersCount}
                    playersMaxCount={hud.playersMaxCount}
                    messages={hud.messages}
                    announce={hud.announce}
                />

                {/* Character Selection */}
                {this.renderCharacterSelection()}
            </View>
        );
    }

    renderCharacterSelection = () => {
        const { showCharacterSelect, selectedCharacter } = this.state;

        if (!showCharacterSelect) {
            return null;
        }

        const charactersList: IListItem[] = Constants.CHARACTER_TYPES.map((value) => ({
            value,
            title: value === 'warrior' ? 'Воин' : value === 'archer' ? 'Лучник' : value,
        }));

        return (
            <View
                fullscreen
                center
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    zIndex: 1000,
                }}
            >
                <View
                    style={{
                        backgroundColor: '#ffffff',
                        padding: 32,
                        borderRadius: 8,
                        minWidth: 300,
                        maxWidth: 400,
                    }}
                >
                    <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>
                        Выберите персонажа
                    </Text>
                    <Space size="m" />

                    <Text>Персонаж:</Text>
                    <Space size="xxs" />
                    <Select
                        value={selectedCharacter}
                        values={charactersList}
                        onChange={(event: any) => {
                            this.handleCharacterSelect(event.target.value);
                        }}
                    />
                    <Space size="m" />

                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                        <Button
                            title="Выбрать персонажа"
                            text="Выбрать"
                            onClick={this.handleCharacterConfirm}
                        />
                    </View>
                </View>
            </View>
        );
    };

    renderJoySticks = () => {
        return (
            <View fullscreen>
                {/* Position */}
                <ReactNipple
                    options={{ mode: 'static', position: { bottom: '20%', left: '20%' } }}
                    onEnd={() => {
                        this.game.inputs.up = false;
                        this.game.inputs.down = false;
                        this.game.inputs.left = false;
                        this.game.inputs.right = false;
                    }}
                    onMove={(event: any, data: any) => {
                        const cardinal = Maths.degreeToCardinal(data.angle.degree);
                        this.game.inputs.up = cardinal === 'NW' || cardinal === 'N' || cardinal === 'NE';
                        this.game.inputs.right = cardinal === 'NE' || cardinal === 'E' || cardinal === 'SE';
                        this.game.inputs.down = cardinal === 'SE' || cardinal === 'S' || cardinal === 'SW';
                        this.game.inputs.left = cardinal === 'SW' || cardinal === 'W' || cardinal === 'NW';
                    }}
                />

                {/* Rotation + shoot */}
                <ReactNipple
                    options={{ mode: 'static', position: { bottom: '20%', right: '20%' } }}
                    onMove={(event: any, data: any) => {
                        const radians = Maths.round2Digits(data.angle.radian - Math.PI);
                        let rotation = 0;
                        if (radians < 0) {
                            rotation = Maths.reverseNumber(radians, -Math.PI, 0);
                        } else {
                            rotation = Maths.reverseNumber(radians, 0, Math.PI);
                        }

                        this.game.forcedRotation = rotation;
                        this.game.inputs.shoot = true;
                    }}
                    onEnd={() => {
                        this.game.inputs.shoot = false;
                    }}
                />
            </View>
        );
    };
}
