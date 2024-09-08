const { exec, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const tmp = require("tmp");

tmp.setGracefulCleanup();

const tmpFile = tmp.fileSync({ postfix: ".json" });
const filePath = tmpFile.name;
const outputPath = "../";
const input = JSON.stringify(
    [
        {
            type: "str",
            id: 19,
            value: "David is cool!",
            style: ["highlight"],
        },
    ],
    null
);

// Helper function for determining the output path of the SVG
const getSVGPath = (isOutputOption: boolean) => {
    let directoryPath = "";
    let fileName = "";

    if (isOutputOption) {
        directoryPath = path.resolve(process.cwd(), outputPath);
        fileName = path.basename(directoryPath + ".svg");
    } else {
        directoryPath = process.cwd();
        fileName = path.basename(filePath.replace(".json", ".svg"));
    }

    return path.resolve(directoryPath, fileName);
};

describe.each([
    {
        inputs: "filepath and output",
        command: `${filePath} --output=${outputPath} --roughjs-config seed=12345`,
    },
    {
        inputs: "filepath, output, and width",
        command: `${filePath} --output=${outputPath} --width=700 --roughjs-config seed=12345`,
    },
    {
        inputs: "filepath, output, and height",
        command: `${filePath} --output=${outputPath} --height=700 --roughjs-config seed=12345`,
    },
    {
        inputs: "filepath, output, height, and width",
        command: `${filePath} --output=${outputPath} --height=700 width=1200 --roughjs-config seed=12345`,
    },
    {
        inputs: "filepath and a variety of rough-config",
        command: `${filePath} --output=${outputPath} --roughjs-config seed=12345,fill=red,fillStyle=solid`,
    },
])("memory-viz cli", ({ inputs, command }) => {
    it(`produces consistent svg when provided ${inputs} option(s)`, (done) => {
        fs.writeFileSync(filePath, input);

        exec(`memory-viz ${command}`, (err) => {
            if (err) throw err;

            const svgFilePath = getSVGPath(command.includes("--output"));
            const fileContent = fs.readFileSync(svgFilePath, "utf8");

            expect(fileContent).toMatchSnapshot();
            fs.unlinkSync(svgFilePath);

            done();
        });
    });
});

describe("memory-viz cli", () => {
    it("produces consistent svg when provided filepath and stdout", (done) => {
        fs.writeFileSync(filePath, input);

        exec(
            `memory-viz ${filePath} --roughjs-config seed=1234`,
            (err, stdout) => {
                if (err) throw err;
                expect(stdout).toMatchSnapshot();
                done();
            }
        );
    });

    it("produces consistent svg when provided stdin and stdout", (done) => {
        const command = "memory-viz";
        const args = ["--roughjs-config seed=1234"];

        const child = spawn(command, args, { shell: true });

        child.stdin.write(input);
        child.stdin.end();

        let output = "";
        child.stdout.on("data", (data) => {
            output += data.toString();
        });

        child.on("close", (err) => {
            if (err) throw err;
            expect(output).toMatchSnapshot();
            done();
        });
    });

    it("produces consistent svg when provided stdin and output", (done) => {
        const command = "memory-viz";
        const args = [`--output=${outputPath}`, "--roughjs-config seed=1234"];

        const child = spawn(command, args, { shell: true });

        child.stdin.write(input);
        child.stdin.end();

        child.on("close", (err) => {
            if (err) throw err;

            const svgFilePath = getSVGPath(true);
            const fileContent = fs.readFileSync(svgFilePath, "utf8");
            expect(fileContent).toMatchSnapshot();
            fs.unlinkSync(svgFilePath);
            done();
        });
    });
    
    // TODO: figure out if this is the correct place to place tests
    // TODO: use describe.each to simplify the tests
    // TODO: clean up test folder
    it("produces consistent svg with default output name when the output path is a folder that does not exist", (done) => {
        const command = "memory-viz";
        const outputPathDir = "test_results/";
        const fullOutputPath = "test_results/memory-viz.svg";
        const args = [`--output=${outputPathDir}`, "--roughjs-config seed=1234"];

        const child = spawn(command, args, { shell: true });

        child.stdin.write(input);
        child.stdin.end();

        child.on("close", (err) => {
            if (err) throw err;

            const fileContent = fs.readFileSync(fullOutputPath, "utf8");
            expect(fileContent).toMatchSnapshot();
            fs.unlinkSync(fullOutputPath);
            done();
        });
    })
    
    // TODO: how to create a temporary folder?
    it("produces consistent svg with default output name when the output path is a folder that exists", (done) => {
        const command = "memory-viz";
        const outputPathDir = "test_results/";
        const fullOutputPath = "test_results/memory-viz.svg";
        const args = [`--output=${outputPathDir}`, "--roughjs-config seed=1234"];

        const child = spawn(command, args, { shell: true });

        child.stdin.write(input);
        child.stdin.end();

        child.on("close", (err) => {
            if (err) throw err;
            
            const fileContent = fs.readFileSync(fullOutputPath, "utf8");
            expect(fileContent).toMatchSnapshot();
            fs.unlinkSync(fullOutputPath);
            done();
        });
    })

    it("produces consistent svg when the outpuat path is a file, and the output folder does not exist", (done) => {
        const command = "memory-viz";
        const fullOutputPath = "test_results/output.svg";
        const args = [`--output=${fullOutputPath}`, "--roughjs-config seed=1234"];

        const child = spawn(command, args, { shell: true });

        child.stdin.write(input);
        child.stdin.end();

        child.on("close", (err) => {
            if (err) throw err;

            const fileContent = fs.readFileSync(fullOutputPath, "utf8");
            expect(fileContent).toMatchSnapshot();
            fs.unlinkSync(fullOutputPath);
            done();
        });
    })

    it("produces consistent svg when the outpuat path is a file, and the output folder exists", (done) => {
        const command = "memory-viz";
        const fullOutputPath = "test_results/output.svg";
        const args = ["--output=test_results/output.svg", "--roughjs-config seed=1234"];

        const child = spawn(command, args, { shell: true });

        child.stdin.write(input);
        child.stdin.end();

        child.on("close", (err) => {
            if (err) throw err;

            const fileContent = fs.readFileSync(fullOutputPath, "utf8");
            expect(fileContent).toMatchSnapshot();
            fs.unlinkSync(fullOutputPath);
            done();
        });
    })
});

describe.each([
    {
        errorType: "non-existent file",
        command: "memory-viz cli-test.json",
        expectedErrorMessage:
            `Command failed: memory-viz cli-test.json\n` +
            `Error: File ${path.resolve(
                process.cwd(),
                "cli-test.json"
            )} does not exist.\n`,
    },
    {
        errorType: "invalid json",
        expectedErrorMessage: "Error: Invalid JSON",
    },
    {
        errorType: "invalid memory-viz json",
        expectedErrorMessage: "Error:",
    },
])(
    "these incorrect inputs to the memory-viz cli",
    ({ errorType, command = undefined, expectedErrorMessage }) => {
        it(`should display ${errorType} error`, (done) => {
            const fileMockingTests = [
                "invalid file type",
                "invalid json",
                "invalid memory-viz json",
            ];

            let filePath: string;
            if (fileMockingTests.includes(errorType)) {
                let err_postfix: string;
                if (errorType === "invalid file type") {
                    err_postfix = ".js";
                } else {
                    err_postfix = ".json";
                }
                const tmpFile = tmp.fileSync({ postfix: err_postfix });
                filePath = tmpFile.name;

                if (errorType === "invalid json") {
                    fs.writeFileSync(filePath, "[1, 2, 3, 4,]");
                } else {
                    fs.writeFileSync(
                        filePath,
                        '[{ "name": "int", "id": 13, "value": 7 }]'
                    );
                }
            }

            if (fileMockingTests.includes(errorType)) {
                command = `memory-viz ${filePath}`;
            }
            exec(command, (err) => {
                if (err) {
                    expect(err.code).toBe(1);
                    expect(err.message).toContain(expectedErrorMessage);
                }
                done();
            });
        });
    }
);
