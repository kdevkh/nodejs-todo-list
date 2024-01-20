import express from "express";
import joi from "joi";
import Todo from "../schemas/todo.schemas.js";

const router = express.Router();

/** Joi 활용 유효성 검사 :
1. `value` 데이터는 **필수적으로 존재**해야한다.
2. `value` 데이터는 **문자열 타입**이어야한다.
3. `value` 데이터는 **최소 1글자 이상**이어야한다.
4. `value` 데이터는 **최대 50글자 이하**여야한다.
5. 유효성 검사에 실패했을 때, 에러가 발생해야한다. --> validateAsync방식 **/
const createdTodoSchema = joi.object({
  value: joi.string().min(1).max(50).required(),
});

/** 할일 등록 API **/
router.post("/todos", async (req, res, next) => {
  try {
    // database를 사용하기 때문에 async를 붙임. 왜냐면 데이터를 조회하는 시간동안 프로그램이 멈출 수 있음 (안쓰면 정상적인 데이터가 조회되지 않을 수 있음)
    //   // 1. 클라이언트로부터 받아온 value 데이터를 가져온다
    //   const { value } = req.body; --> 요걸 주석처리 한 이유는 req.body가 객체라 유효성 검사 자체를 요걸로 진행하기 위함

    const validation = await createdTodoSchema.validateAsync(req.body);

    const { value } = validation;

    // 1-5. 만약, 클라이언트가 value 데이터를 전달하지 않았을 때, 클라이언트에게 에러 메시지를 전달한다
    if (!value) {
      return res
        .status(400)
        .json({ errorMessage: "해야할 일(value) 데이터가 존재하지 않습니다." });
    }

    // 2. 해당하는 마지막 order 데이터를 조회한다
    // findOne = 1개의 데이터만 조회한다
    // sort = 정렬한다 -> 어떤 칼럼을? order앞에 마이너스(-) 붙이면 내림차순 정렬됨
    const todoMaxOrder = await Todo.findOne().sort("-order").exec(); // 여기 "Todo"는 몽구스의 모델임

    // 3. 존재한다면 현재 해야 할 일을 +1 하고, order 데이터가 존재하지 않다면, 1로 할당한다
    const order = todoMaxOrder ? todoMaxOrder.order + 1 : 1;

    // 4. 해야할 일 등록
    const todo = new Todo({ value, order });
    await todo.save();

    // 5. 해야할 일을 클라이언트에게 반환한다
    return res.status(201).json({ todo: todo });
  } catch (error) {
    console.error(error);
    // Joi 검증에서 에러가 발생하면, 클라이언트에게 에러 메시지를 전달합니다.
    if (error.name === "ValidationError") {
      return res.status(400).json({ errorMessage: error.message });
    }

    // 그 외의 에러가 발생하면, 서버 에러로 처리합니다.
    return res
      .status(500)
      .json({ errorMessage: "서버에서 에러가 발생하였습니다." });
  }
});

/** 해야할 일 목록 조회 **/
router.get("/todos", async (req, res, next) => {
  // 1. 해야할 일 목록 조회를 진행한다
  const todos = await Todo.find().sort("-order").exec();

  // 2. 해야할 일 목록 조회 결과를 클라이언트에게 반환한다
  return res.status(200).json({ todos });
});

/** 해야할 일 순서 변경, 완료 / 해제, 내용 변경 API **/
router.patch("/todos/:todoId", async (req, res, next) => {
  // 뒤에 :todoId 경로 매개변수는 나중에 어떤 해야 할 일을 수정해야 될 지 알기 위해 사용함
  const { todoId } = req.params;
  const { order, done, value } = req.body;

  // 현재 나의 order가 무엇인지 알아야함
  const currentTodo = await Todo.findById(todoId).exec();
  if (!currentTodo) {
    return res
      .status(404)
      .json({ errorMessage: "존재하지 않는 해야할 일 입니다." });
  }
  if (order) {
    const targetTodo = await Todo.findOne({ order }).exec();
    if (targetTodo) {
      targetTodo.order = currentTodo.order;
      await targetTodo.save();
    }

    currentTodo.order = order;
  }
  if (done !== undefined) {
    // 변경하려는 '해야할 일'의 doneAt 값을 변경합니다.
    currentTodo.doneAt = done ? new Date() : null;
  }
  if (value) {
    currentTodo.value = value;
  }

  await currentTodo.save();

  return res.status(200).json({});
});

/** 할 일 삭제 API **/
router.delete("/todos/:todoId", async (req, res, next) => {
  const { todoId } = req.params;

  const todo = await Todo.findById(todoId).exec();
  if (!todo) {
    return res
      .status(404)
      .json({ errorMessage: "존재하지 않는 해야할 일 정보입니다." });
  }

  await Todo.deleteOne({ _id: todoId });

  return res.status(200).json({});
});

export default router;
