import { useEffect, useReducer } from 'react'

import Header from './Header.js'
import Main from './Main.js'
import Loader from './Loader.js'
import StartScreen from './StartScreen.js'
import Error from './Error.js'
import Question from './Question.js'
import NextButton from './NextButton.js'
import Progress from './Progress.js'
import FinishedScreen from './FinishedScreen.js'
import Footer from './Footer.js'
import Timer from './Timer.js'

const SECS_PER_QUES = 30

const initialState = {
  questions: [],
  status: 'loading',
  index: 0,
  answer: null,
  points: 0,
  highscore: 0,
  secondsRemaining: null
}

function reducer(state, action) {
  switch (action.type) {
    case 'dataReceived':
      return { ...state, questions: action.payload, status: 'ready' }
    case 'dataFailed':
      return { ...state, status: 'error' }
    case 'start':
      return {
        ...state, status: 'active',
        secondsRemaining: state.questions.length * SECS_PER_QUES
      }
    case 'newAnswer':
      const question = state.questions.at(state.index);
      return {
        ...state,
        answer: action.payload,
        points:
          action.payload === question.correctOption
            ? state.points + question.points
            : state.points
      }
    case 'nextQuestion':
      return { ...state, index: state.index + 1, answer: null }
    case 'finish':
      return {
        ...state,
        status: 'finished',
        highscore: state.points > state.highscore
          ? state.points : state.highscore
      }
    case 'restart':
      return {
        ...initialState, questions: state.questions, status: 'ready'
      }
    case 'tick':
      return {
        ...state,
        secondsRemaining: state.secondsRemaining - 1,
        status: state.secondsRemaining === 0 ? "finished" : state.status
      }
    default:
      throw new Error("Unknown Action")
  }
}

export default function App() {

  const [{ status, questions, index, answer, points, highscore, secondsRemaining }, dispatch] = useReducer(reducer, initialState)

  const numQuestions = questions.length
  const maxPossiblePoints = questions.reduce((prev, cur) => prev + cur.points, 0)

  useEffect(function () {
    fetch('http://localhost:9000/questions')
      .then((res) => res.json())
      .then((data) => {
        dispatch({ type: 'dataReceived', payload: data });
      })
      .catch((error) => {
        // console.error('Error fetching data:', error);
        dispatch({ type: 'dataFailed' });
      });
  }, []);


  return <div className=''>
    <Header />

    <Main>
      {status === 'loading' && <Loader />}
      {status === 'ready' && <StartScreen numQuestions={numQuestions} dispatch={dispatch} />}
      {status === 'error' && <Error />}
      {status === 'active' &&
        <>
          <Progress
            index={index}
            numQuestions={numQuestions}
            points={points}
            maxPossiblePoints={maxPossiblePoints}
            answer={answer}
          />
          <Question
            question={questions[index]}
            dispatch={dispatch}
            answer={answer}
          />
          <Footer>
            <Timer dispatch={dispatch} secondsRemaining={secondsRemaining} />
            <NextButton
              dispatch={dispatch}
              answer={answer}
              index={index}
              numQuestions={numQuestions}
            />
          </Footer>
        </>
      }
      {status === 'finished' &&
        <FinishedScreen
          points={points}
          maxPossiblePoints={maxPossiblePoints}
          highscore={highscore}
          dispatch={dispatch}
        />}
    </Main>
  </div>
}