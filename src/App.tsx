import React, { useState, useEffect, useRef,useCallback} from 'react';
import { Helmet } from 'react-helmet';
import {
	Button,
	Paper,
	Typography,
	TextField,
	Select,   
	MenuItem,
	FormControl,
	InputLabel,
	Grid,
	Slider,
	Stack,
     Theme,
     ThemeProvider, 
     createTheme
} from '@mui/material';
import { VolumeDown, VolumeUp } from '@mui/icons-material';
import { SelectChangeEvent } from '@mui/material/Select';

// タイマーの状態を管理する列挙型
enum TimerState {
	WORK,
	BREAK,
	PAUSED,
     LONG_BREAK
}

const App: React.FC = () => {
     // 定数とリファレンスの設定
	const initialWorkTime = parseInt(localStorage.getItem('workTime') || '1500');
	const initialBreakTime = parseInt(localStorage.getItem('breakTime') || '300');
     const initialVolume = parseFloat(localStorage.getItem('volume') || '1');
     const initialAudio = localStorage.getItem('audio') || 'default1';
     const audioOptions: { [key: string]: string } = {
          default1: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
     };

     const workAudioRef = useRef(new Audio(audioOptions.default1));
     const breakAudioRef = useRef(new Audio(audioOptions.default1));
     const audioRef = useRef(new Audio(audioOptions[initialAudio] || initialAudio));


	// 状態の初期化
	const initialCompletedCycles = parseInt(localStorage.getItem('completedCycles') || '0');
	const [longBreakTime, setLongBreakTime] = useState<number>(parseInt(localStorage.getItem('longBreakTime') || '900'));
	const [longBreakInterval, setLongBreakInterval] = useState<number>(parseInt(localStorage.getItem('longBreakInterval') || '4'));
	const [completedCycles, setCompletedCycles] = useState<number>(initialCompletedCycles);
	const [seconds, setSeconds] = useState<number>(initialWorkTime);
	const [workTime, setWorkTime] = useState<number>(initialWorkTime);
	const [breakTime, setBreakTime] = useState<number>(initialBreakTime);
	const [audioOption, setAudioOption] = useState<string>(initialAudio);
	const [timerState, setTimerState] = useState<TimerState>(TimerState.WORK);
	const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
	const [volume, setVolume] = useState<number>(initialVolume);
	const [isFullScreen, setIsFullScreen] = useState(false);
	const [selectedFileName, setSelectedFileName] = useState<string>('音声ファイルを選択');
	const fileInputRef = useRef<HTMLInputElement>(null);

	// タイマーの制御
	const toggleTimer = () => {
		if (intervalId) {
			clearInterval(intervalId);
			setIntervalId(null);
			setTimerState(TimerState.PAUSED);
		} else {
			const id = setInterval(() => {
				setSeconds(prevSeconds => prevSeconds - 1);
			}, 1000);
			setIntervalId(id);
			setTimerState(timerState === TimerState.PAUSED ? TimerState.WORK : timerState);
		}
	};

	// タイマーのリセット
	const resetTimer = () => {
		if (intervalId) {
			clearInterval(intervalId);
			setIntervalId(null);
		}
		setSeconds(workTime);
		setTimerState(TimerState.WORK);
	};

     // 作業時間の変更
     const handleWorkTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const value = parseInt(e.target.value);
          if (value < 1) {
               // マイナスの場合、何もしないか、デフォルト値を使用
               return;
          }
          const calculatedValue = value * 60;
          setWorkTime(calculatedValue);
          localStorage.setItem('workTime', calculatedValue.toString());
          if (!intervalId) {
               setSeconds(calculatedValue);
          }
     };

     // 休憩時間の変更
     const handleBreakTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const value = parseInt(e.target.value);
          if (value < 1) {
               // マイナスの場合、何もしないか、デフォルト値を使用
               return;
          }
          const calculatedValue = value * 60;
          setBreakTime(calculatedValue);
          localStorage.setItem('breakTime', calculatedValue.toString());
          if (!intervalId && timerState === TimerState.BREAK) {
               setSeconds(calculatedValue);
          }
     };

     // 長時間休憩の時間を変更
     const handleLongBreakTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const value = parseInt(e.target.value);
          if (value < 1) {
               return;
          }
          const calculatedValue = value * 60;
          setLongBreakTime(calculatedValue);
          localStorage.setItem('longBreakTime', calculatedValue.toString());
     };

     // 長時間休憩のインターバルを変更
     const handleLongBreakIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const value = parseInt(e.target.value);
          if (value < 1) {
               return;
          }
          setLongBreakInterval(value);
          localStorage.setItem('longBreakInterval', value.toString());
     };

	// 音声オプションの変更
	const handleAudioChange = (e: SelectChangeEvent<string>) => {
		const value = e.target.value;
		setSelectedFileName('音声ファイルを選択');
		setAudioOption(value);
		audioRef.current = new Audio(audioOptions[value] || value);
		localStorage.setItem('audio', value);
	};

	// 音声ファイルのアップロード
	const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const blobUrl = URL.createObjectURL(file);
			setAudioOption(blobUrl);
			audioRef.current = new Audio(blobUrl);
			localStorage.setItem('audio', blobUrl);
		}
	};

	// 音量の変更
	const handleVolumeChange = (e: Event, newValue: number | number[]) => {
		const newVolume = Array.isArray(newValue) ? newValue[0] / 100 : newValue / 100;
		setVolume(newVolume);
		audioRef.current.volume = newVolume;
		localStorage.setItem('volume', newVolume.toString());
	};

	// フルスクリーンモードの切り替え
	const toggleFullScreen = () => {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen();
			setIsFullScreen(true);
		} else {
			document.exitFullscreen();
			setIsFullScreen(false);
		}
	};

	// タイマーの残り時間が変わったときの処理
	useEffect(() => {
		if (seconds <= 0) {
			let audioRefCurrent;
			switch (timerState) {
				case TimerState.WORK:
					audioRefCurrent = workAudioRef.current;
					break;
				case TimerState.BREAK:
					audioRefCurrent = breakAudioRef.current;
					break;
				case TimerState.LONG_BREAK:
					audioRefCurrent = breakAudioRef.current;
					break;
				default:
					audioRefCurrent = null;
			}

			if (audioRefCurrent) {
				audioRefCurrent.volume = volume;
				audioRefCurrent.play();
			}

			if (timerState === TimerState.WORK) {
				setCompletedCycles(prevCycles => prevCycles + 1);
				if (completedCycles >= longBreakInterval) {
					setSeconds(longBreakTime);
					setTimerState(TimerState.LONG_BREAK); // 状態を長期休憩に
					setCompletedCycles(1); // サイクルのリセット
				} else {
					setSeconds(breakTime);
					setTimerState(TimerState.BREAK);
				}
			} else if (timerState === TimerState.LONG_BREAK) {
				setSeconds(workTime);
				setTimerState(TimerState.WORK);
			} else {
				setSeconds(workTime);
				setTimerState(TimerState.WORK);
			}
		}
	}, [seconds, timerState, workTime, breakTime, volume, longBreakTime, longBreakInterval, completedCycles]);


     const handleFileButtonClick = () => {
          if (fileInputRef.current) {
               fileInputRef.current.click();
          }
     };

     const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
          handleAudioUpload(e);
          const file = e.target.files?.[0];
          if (file) {
               setAudioOption(''); 
               setSelectedFileName(file.name);
          }
     };

	const renderTimerState = () => {
		switch (timerState) {
			case TimerState.WORK:
				return "作業中";
			case TimerState.BREAK:
				return "休憩中";
			case TimerState.PAUSED:
				return "一時停止中";
			case TimerState.LONG_BREAK:  
				return "長期休憩中";
			default:
				return "";
		}
	};

	const getBackgroundColor = useCallback(() => {
		switch (timerState) {
			case TimerState.WORK:
				return '#38b48b'; // 緑色
			case TimerState.BREAK:
				return '#f7c114'; // 青色
			case TimerState.PAUSED:
				return '#ee7800'; // 赤色
			case TimerState.LONG_BREAK: // 追加
				return '#6c8e17'; // 長期休憩の背景色
			default:
				return '#17184b'; // 紺色
		}
	}, [timerState]);


	const [theme, setTheme] = useState<Theme | null>(null);

	useEffect(() => {
		const backgroundColor = getBackgroundColor();
		const newTheme = createTheme({
			palette: {
				primary: {
					main: backgroundColor,
				},
			},
		});
		setTheme(newTheme);
	}, [timerState, getBackgroundColor]);

     const renderLongBreakRemaining = () => {
          const remainingCycles = longBreakInterval - completedCycles;
          return (
               <>
                    <p>長期休憩まであと: {remainingCycles} サイクル</p>
               </>
          );
     };

	return (
          <ThemeProvider theme={theme ? theme : createTheme()}>
		<Grid container justifyContent="center" alignItems="center" style={{ minHeight: '100vh', padding: '1em' }}>
               <Helmet>
                    <title>ポモドーロ-作業タイマーアプリ</title>
                    <meta name="description" content="効率的に作業と休憩を切り替えるためのタイマーアプリです。" />
                    <meta name="keywords" content="タイマー, 作業, 休憩, Pomodoro" />
                    <meta name="author" content="Wakamiya Yuma from LLC. Fly Tree" />
                    <link rel="canonical" href="https://pomo.fly-tree.com/" />
                    <meta property="og:title" content="ポモドーロ-作業タイマーアプリ" />
                    <meta property="og:description" content="効率的に作業と休憩を切り替えるためのタイマーアプリです。" />
                    <meta property="og:type" content="website" />
                    <meta property="og:url" content="https://pomo.fly-tree.com/" />
                    <meta property="og:image" content="https://pomo.fly-tree.com/snsimage.png" />
                    <meta property="og:locale" content="ja_JP" />
                    <meta property="og:site_name" content="合同会社Fly Tree" />
                    <meta name="twitter:card" content="summary_large_image" />
                    <meta name="twitter:site" content="@FlyTree" />
                    <meta name="twitter:title" content="ポモドーロ-作業タイマーアプリ" />
                    <meta name="twitter:description" content="効率的に作業と休憩を切り替えるためのタイマーアプリです。" />
                    <meta name="twitter:image" content="https://pomo.fly-tree.com/snsimage.png" />
                    <meta name="robots" content="index, follow" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
               </Helmet>
                    <Grid item xs={12} sm={8} md={6}>
                         <Paper elevation={3} style={{ padding: '2em', textAlign: 'center' }}>
                              <Typography variant="h1" style={{fontSize:'calc(10vw + 5rem)'}}>
                                   {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
                              </Typography>
                              <Typography variant="h4" style={{ color: getBackgroundColor() }}>
                                   {renderTimerState()}
                              </Typography>
                              <Typography variant="h6" style={{ color: getBackgroundColor() }}>
                                   {renderLongBreakRemaining()}
                              </Typography>
                              <Grid container spacing={3} justifyContent="center" style={{ marginTop: '1em' }}>
                                   <Grid item xs={6}>
                                        <TextField
                                             label="作業時間"
                                             type="number"
                                             value={workTime / 60}
                                             onChange={handleWorkTimeChange}
                                             fullWidth
                                        />
                                   </Grid>
                                   <Grid item xs={6}>
                                        <TextField
                                             label="休憩時間"
                                             type="number"
                                             value={breakTime / 60}
                                             onChange={handleBreakTimeChange}
                                             fullWidth
                                        />
                                   </Grid>
                                   <Grid item xs={6}>
                                        <TextField
                                             label="長時間休憩（分）"
                                             type="number"
                                             value={longBreakTime / 60}
                                             onChange={handleLongBreakTimeChange}
                                             fullWidth
                                        />
                                   </Grid>
                                   <Grid item xs={6}>
                                        <TextField
                                             label="何回に一回長時間休憩"
                                             type="number"
                                             value={longBreakInterval}
                                             onChange={handleLongBreakIntervalChange}
                                             fullWidth
                                        />
                                   </Grid>
                                   <Grid item xs={6}>
                                        <FormControl fullWidth>
                                             <InputLabel>プリセットサウンド</InputLabel>
                                             <Select value={audioOption} onChange={handleAudioChange} fullWidth>
                                                  <MenuItem value="default1">デフォルト</MenuItem>
                                             </Select>
                                        </FormControl>
                                   </Grid>
                                        <Grid item xs={6}>
                                             <input
                                                  ref={fileInputRef}
                                                  type="file"
                                                  accept="audio/mp3"
                                                  onChange={handleFileSelection}
                                                  style={{ display: 'none' }}
                                             />
                                             <Button variant="outlined" onClick={handleFileButtonClick}  style={{ width: '100%', height: '56px' }}>
                                                  {selectedFileName}
                                             </Button>
                                        </Grid>
                                        <Grid item xs={6}>
                                   <Stack spacing={2} direction="row" alignItems="center" style={{ width: '100%' }}>
                                        <VolumeDown />
                                        <Slider 
                                             aria-label="Volume" 
                                             value={volume * 100} 
                                             onChange={handleVolumeChange}
                                             style={{ flexGrow: 1 }}
                                             />
                                        <VolumeUp />
                                   </Stack>
                              </Grid>
                              <Grid item xs={6}>
                                   <Button variant="outlined" onClick={toggleFullScreen} style={{ width: '100%', height: '56px' }}>
                                        {isFullScreen ? '全画面解除' : '全画面表示'}
                                   </Button>
                              </Grid>
                         </Grid>
                         <div style={{ marginTop: '1em', display: 'flex', justifyContent: 'center' }}>
                              <Button variant="contained" color="primary" onClick={toggleTimer} style={{ width: '48%', height: '56px' }}>
                                   {intervalId ? 'ストップ' : 'スタート'}
                              </Button>
                              <Button variant="contained" onClick={resetTimer} style={{ marginLeft: '4%', width: '48%', height: '56px' }}>
                                   リセット
                              </Button>
                         </div>
                    </Paper>
               </Grid>
          </Grid>
     </ThemeProvider>
     );
          }
          
export default App;